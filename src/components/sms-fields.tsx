"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SMS_CONSENT =
  "Text me when someone shares a program that fits what I look at here. About 1 text a day at most. Message and data rates may apply. Reply STOP to opt out at any time.";

/** Opt-in checkbox and phone number. Optional: nobody has to give a phone number. */
export function SmsFields({
  idPrefix,
  smsOptIn,
  phone,
  onChange,
  disabled,
}: {
  idPrefix: string;
  smsOptIn: boolean;
  phone: string;
  onChange: (next: { smsOptIn: boolean; phone: string }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={`${idPrefix}-opt-in`}
          checked={smsOptIn}
          onCheckedChange={(checked) => onChange({ smsOptIn: checked === true, phone })}
          disabled={disabled}
          className="mt-0.5"
        />
        <Label htmlFor={`${idPrefix}-opt-in`} className="block text-sm leading-snug font-normal">
          {SMS_CONSENT}
        </Label>
      </div>
      {smsOptIn ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Mobile phone number</Label>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => onChange({ smsOptIn, phone: e.target.value })}
            disabled={disabled}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Texts point to community posts, not official notices. We only use your number for these
            texts.
          </p>
        </div>
      ) : null}
    </div>
  );
}
