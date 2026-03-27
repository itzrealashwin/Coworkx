import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import LogoUploader from "./LogoUploader";
import SlugInput from "./SlugInput";
import { useCreateOrganization } from "@/hooks/useOrganizations";

export default function CreateOrgForm() {
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Workspace name is required";
    if (!formData.slug.trim()) newErrors.slug = "Workspace URL is required";
    else if (formData.slug.length < 3)
      newErrors.slug = "URL must be at least 3 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    createOrg.mutate(
      {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        // If logoUrl is empty, send undefined so the backend ignores it
        // rather than failing on an invalid URL validation
        ...(formData.logoUrl.trim() ? { logoUrl: formData.logoUrl } : {}),
      },
      {
        onSuccess: () => navigate(`/${formData.slug}`),
        onError: (err) => {
          setErrors({ form: err.response?.data?.message || "Failed to create workspace." });
        },
      }
    );
  };
  return (
    <Card className="w-full shadow-sm border-border overflow-hidden">
      <div className="bg-muted/30 border-b border-border px-6 py-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-border/50 px-2 py-0.5 rounded-sm">
            Step 1 of 1
          </span>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-border" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Let's setup your workspace
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          You can always change these details later in settings.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">

          <LogoUploader
            value={formData.logoUrl}
            onChange={(url) =>
              setFormData(prev => ({ ...prev, logoUrl: url }))
            }
          />

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[13px] font-semibold text-foreground">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Acme Corp"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData(prev => ({ ...prev, name }));
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              className={`h-10 text-sm font-medium transition-all duration-150 ${
                errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""
              }`}
            />
            {errors.name && (
              <p className="text-[12px] text-destructive font-medium mt-1">{errors.name}</p>
            )}
          </div>

          <SlugInput
            nameValue={formData.name}
            value={formData.slug}
            error={errors.slug}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, slug: val }));
              if (errors.slug) setErrors(prev => ({ ...prev, slug: null }));
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-[13px] font-semibold text-foreground">
              Description{" "}
              <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="What is your team working on?"
              value={formData.description}
              onChange={(e) => {
                const description = e.target.value;
                setFormData(prev => ({ ...prev, description }));
              }}
              className="resize-none h-20 text-sm font-medium"
            />
          </div>

          {errors.form && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3.5 py-3 flex items-start gap-2.5">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-destructive">
                <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="6" cy="8.5" r="0.75" fill="currentColor" />
              </svg>
              <p className="text-[13px] text-destructive font-medium">{errors.form}</p>
            </div>
          )}
        </CardContent>

        <div className="border-t border-border bg-muted/30 p-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
            Free forever for individuals and small teams up to 5 users.
          </p>
          <Button
            type="submit"
            disabled={createOrg.isPending}
            className="h-9 px-5 text-sm font-bold shadow-sm"
          >
            {createOrg.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Workspace"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}