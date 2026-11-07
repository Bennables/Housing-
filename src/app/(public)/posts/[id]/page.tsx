import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/disclaimer";
import { CommentForm } from "@/components/feed/comment-form";
import { CommentList } from "@/components/feed/comment-list";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { viewerStateOf } from "@/components/viewer-state";
import { getComments, getPost } from "@/lib/data/posts";
import { getViewer } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Post" };

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  const post = await getPost(id, viewer);
  if (!post) notFound();
  const comments = await getComments(post.id);
  const viewerState = viewerStateOf(viewer);

  return (
    <div className="space-y-5">
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Back to the feed
      </Link>

      <PostCard post={post} viewerState={viewerState} viewerId={viewer?.id ?? null} detail />
      {viewer?.isAdmin && !post.listing && post.sourceUrl ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-3">
          <p className="text-sm">This post is about an opportunity that is not listed yet.</p>
          <Button asChild size="sm">
            <Link href={`/admin/listings/new?fromPost=${post.id}`}>Make it a listing</Link>
          </Button>
        </div>
      ) : null}
      <Disclaimer />

      <section aria-labelledby="comments-title" className="space-y-4">
        <h2 id="comments-title" className="font-semibold">
          Comments ({comments.length})
        </h2>
        <CommentList comments={comments} />
        <CommentForm postId={post.id} viewerState={viewerState} />
      </section>
    </div>
  );
}
