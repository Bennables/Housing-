import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agencies, listings, smsNotifications, posts, postViews, users } from "@/db/schema";
import { buildSmsText, postTags, topTags } from "@/lib/interests";
import { getInterestProfiles } from "@/lib/data/interests";
import { appUrl, sendSms, smsConfigured } from "./sms";

// When someone creates a post, find people who may care about it and text them.
//
// Cost control: SQL narrows the list first (opted in, right audience, not the author, has some
// viewing history, not texted about this post or in the last day), then one Claude call per post
// judges every remaining candidate at once.
//
// Only posts that share a public listing trigger texts. A community post without a listing has
// not been checked by anyone, and we should not text people about unverified information.

const MODEL = "claude-haiku-5-5";
const MAX_CANDIDATES = 50;

const matchSchema = z.object({
  matches: z.array(
    z.object({
      candidateId: z.string(),
      relevant: z.boolean(),
      reason: z.string(),
    }),
  ),
});

const SYSTEM_PROMPT = `You decide which people should get a short text about a new post on a housing help site.
The site helps low-income households find benefits and helps affordable housing builders find funding.

You get the post's tags and a list of candidates. Each candidate has a role and an interest profile: tags from posts they opened, with counts.
Mark a candidate relevant only when the post clearly fits their interests, such as the same category or program type, or a state they follow.
A text is an interruption. When in doubt, mark the candidate not relevant.
Return one entry for every candidate. Keep each reason under 15 words.`;

export async function notifyMatchesForPost(postId: string): Promise<void> {
  try {
    await run(postId);
  } catch (error) {
    // This runs after the response is sent, so log and move on.
    console.error("[notify] match run failed", { postId, error });
  }
}

async function run(postId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY || !smsConfigured()) return;

  const [post] = await db
    .select({ post: posts, listing: listings, listingAgencyVerified: agencies.verified })
    .from(posts)
    .leftJoin(listings, eq(listings.id, posts.listingId))
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post?.listing) return;
  const listingIsPublic = post.listing.agencyId === null || post.listingAgencyVerified === true;
  if (!listingIsPublic) return;

  const tags = postTags({
    targetAudience: post.post.targetAudience,
    states: post.post.states,
    benefitFrequency: post.post.benefitFrequency,
    listing: post.listing,
  });

  const candidates = await findCandidates(
    post.post.id,
    post.post.authorId,
    post.post.targetAudience,
  );
  if (candidates.length === 0) return;

  const profiles = await getInterestProfiles(candidates.map((c) => c.id));
  // Anonymous ids: Claude never sees names, emails or phone numbers.
  const anon = candidates
    .filter((c) => profiles.has(c.id))
    .map((c, i) => ({ ...c, anonId: `c${i + 1}`, interests: topTags(profiles.get(c.id)!) }));
  if (anon.length === 0) return;

  const relevant = await askClaude(tags, post.listing.name, anon);
  const byAnonId = new Map(anon.map((c) => [c.anonId, c]));
  const postUrl = `${appUrl()}/posts/${post.post.id}`;
  const message = buildSmsText({ postUrl, listingName: post.listing.name });

  for (const match of relevant) {
    const candidate = byAnonId.get(match.candidateId);
    if (!candidate) continue;

    // Claim the (user, post) pair first. If the row already exists, someone else sent it.
    const [claimed] = await db
      .insert(smsNotifications)
      .values({ userId: candidate.id, postId: post.post.id, reason: match.reason })
      .onConflictDoNothing()
      .returning({ id: smsNotifications.id });
    if (!claimed) continue;

    const result = await sendSms(candidate.phone, message);
    await db
      .update(smsNotifications)
      .set(
        result.ok
          ? { status: "sent", providerMessageId: result.messageId }
          : { status: "failed", reason: `${match.reason} | send error: ${result.error}` },
      )
      .where(eq(smsNotifications.id, claimed.id));
  }
}

async function findCandidates(
  postId: string,
  authorId: string,
  audience: "builder" | "household" | "both",
) {
  const roles = audience === "both" ? (["builder", "household"] as const) : ([audience] as const);
  const rows = await db
    .select({ id: users.id, role: users.role, phone: users.phone })
    .from(users)
    .where(
      and(
        eq(users.smsOptIn, true),
        isNotNull(users.phone),
        ne(users.id, authorId),
        inArray(users.role, [...roles]),
        sql`exists (select 1 from ${postViews} where ${postViews.userId} = ${users.id})`,
        // No repeat text about this post, and at most one text per person per day.
        sql`not exists (
          select 1 from ${smsNotifications}
          where ${smsNotifications.userId} = ${users.id}
            and (${smsNotifications.postId} = ${postId} or ${smsNotifications.createdAt} > now() - interval '1 day')
        )`,
      ),
    )
    .orderBy(
      sql`(select max(${postViews.viewedAt}) from ${postViews} where ${postViews.userId} = ${users.id}) desc`,
    )
    .limit(MAX_CANDIDATES);
  return rows.flatMap((r) => (r.phone ? [{ id: r.id, role: r.role, phone: r.phone }] : []));
}

async function askClaude(
  tags: string[],
  listingName: string,
  candidates: { anonId: string; role: string; interests: Record<string, number> }[],
) {
  const client = new Anthropic();
  // Only tags and the listing's official name go to Claude, never the post body. That keeps
  // user-written text out of the prompt.
  const input = {
    post: { listingName, tags },
    candidates: candidates.map((c) => ({
      candidateId: c.anonId,
      role: c.role,
      interests: c.interests,
    })),
  };

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low", format: zodOutputFormat(matchSchema) },
      messages: [{ role: "user", content: JSON.stringify(input) }],
    });
    if (response.stop_reason !== "end_turn" || !response.parsed_output) {
      console.warn("[notify] no usable match result", { stop: response.stop_reason });
      return [];
    }
    return response.parsed_output.matches.filter((m) => m.relevant);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.warn("[notify] Claude rate limited, skipping this post");
    } else if (error instanceof Anthropic.APIError) {
      console.error("[notify] Claude API error", error.status, error.message);
    } else {
      throw error;
    }
    return [];
  }
}
