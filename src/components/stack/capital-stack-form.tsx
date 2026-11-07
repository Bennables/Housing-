"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { saveCapitalStack } from "@/lib/actions/capital-stack";
import { AMI_PERCENTS, LABELS, PROJECT_TYPES, type ProjectType } from "@/lib/constants";

// Official income limits by county and household size. Builders look up AMI here.
const INCOME_LIMITS_URL = "https://www.huduser.gov/portal/datasets/il.html";

export type CapitalStackFormValues = {
  projectName: string;
  projectType: ProjectType;
  totalCostDollars: string;
  firstMortgageDollars: string;
  unitCount: string;
  areaMedianIncomeDollars: string;
  amiPercent: string;
  housingCostPercent: string;
  interestRatePercent: string;
  downPaymentPercent: string;
  otherMonthlyDollars: string;
};

const EMPTY: CapitalStackFormValues = {
  projectName: "",
  projectType: "rental",
  totalCostDollars: "",
  firstMortgageDollars: "",
  unitCount: "",
  areaMedianIncomeDollars: "",
  amiPercent: "80",
  housingCostPercent: "30",
  interestRatePercent: "",
  downPaymentPercent: "",
  otherMonthlyDollars: "",
};

export function CapitalStackForm({ initial }: { initial?: CapitalStackFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<CapitalStackFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ownership = values.projectType === "ownership";

  const set =
    (key: keyof CapitalStackFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: event.target.value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCapitalStack(values);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="stack-name">Project name</Label>
        <Input id="stack-name" value={values.projectName} onChange={set("projectName")} required />
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">What will the project be?</legend>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-accent/40"
            >
              <input
                type="radio"
                name="stack-project-type"
                value={type}
                checked={values.projectType === type}
                onChange={set("projectType")}
                className="accent-primary"
              />
              {LABELS.projectType[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="stack-total" label="Total development cost ($)">
        <Input
          id="stack-total"
          inputMode="decimal"
          placeholder="2,500,000"
          value={values.totalCostDollars}
          onChange={set("totalCostDollars")}
          required
        />
      </Field>

      {ownership ? (
        <div className="space-y-3 rounded-lg border border-dashed p-3">
          <div>
            <p className="text-sm font-semibold">What can buyers afford?</p>
            <p className="text-xs text-muted-foreground">
              Buyers should spend about 30 to 35% of income on housing. Look up your area median
              income (AMI) in the{" "}
              <a href={INCOME_LIMITS_URL} target="_blank" rel="noreferrer" className="underline">
                official income limits
              </a>
              . We never ask for anyone&apos;s real income.
            </p>
          </div>
          <Field id="stack-units" label="Homes for sale">
            <Input
              id="stack-units"
              inputMode="numeric"
              placeholder="12"
              value={values.unitCount}
              onChange={set("unitCount")}
              required
            />
          </Field>
          <Field id="stack-ami" label="Area median income, per year ($)">
            <Input
              id="stack-ami"
              inputMode="decimal"
              placeholder="From the income limits table"
              value={values.areaMedianIncomeDollars}
              onChange={set("areaMedianIncomeDollars")}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field id="stack-band" label="Income band">
              <NativeSelect id="stack-band" value={values.amiPercent} onChange={set("amiPercent")}>
                {AMI_PERCENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}% of AMI
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="stack-share" label="Share for housing">
              <NativeSelect
                id="stack-share"
                value={values.housingCostPercent}
                onChange={set("housingCostPercent")}
              >
                {[30, 31, 32, 33, 34, 35].map((p) => (
                  <option key={p} value={p}>
                    {p}% of income
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field id="stack-rate" label="Mortgage rate (%)">
              <Input
                id="stack-rate"
                inputMode="decimal"
                placeholder="6.5"
                value={values.interestRatePercent}
                onChange={set("interestRatePercent")}
                required
              />
            </Field>
            <Field id="stack-down" label="Down payment (%)">
              <Input
                id="stack-down"
                inputMode="decimal"
                placeholder="3"
                value={values.downPaymentPercent}
                onChange={set("downPaymentPercent")}
                required
              />
            </Field>
          </div>
          <Field id="stack-other" label="Monthly taxes, insurance and HOA ($)">
            <Input
              id="stack-other"
              inputMode="decimal"
              placeholder="450"
              value={values.otherMonthlyDollars}
              onChange={set("otherMonthlyDollars")}
            />
          </Field>
          <p className="text-xs text-muted-foreground">Assumes a 30-year fixed mortgage.</p>
        </div>
      ) : (
        <Field id="stack-mortgage" label="First mortgage, if any ($)">
          <Input
            id="stack-mortgage"
            inputMode="decimal"
            placeholder="1,000,000"
            value={values.firstMortgageDollars}
            onChange={set("firstMortgageDollars")}
          />
        </Field>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save project"}
      </Button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
