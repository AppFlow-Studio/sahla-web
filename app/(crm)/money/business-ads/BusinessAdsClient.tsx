"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import PageHeader from "../../_components/PageHeader";
import EmptyState from "../../_components/EmptyState";
import ConfirmInline from "../../_components/ConfirmInline";
import BusinessAdForm, {
  type BusinessAdFormValues,
  PLACEMENT_LABELS,
} from "./BusinessAdForm";
import {
  useBusinessAds,
  type BusinessAd,
} from "../../_hooks/useBusinessAds";

const EASE = [0.16, 1, 0.3, 1] as const;

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; ad: BusinessAd };

export default function BusinessAdsClient() {
  const { data: ads, isLoading, add, update, remove } = useBusinessAds();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleSubmit(values: BusinessAdFormValues) {
    if (dialog.mode === "add") {
      add(values);
      toast.success(`${values.businessName} added`);
    } else if (dialog.mode === "edit") {
      update(dialog.ad.id, values);
      toast.success(`${values.businessName} updated`);
    }
    setDialog({ mode: "closed" });
  }

  function handleDelete(ad: BusinessAd) {
    remove(ad.id);
    setConfirmId(null);
    toast.success(`${ad.businessName} removed`);
  }

  const isEmpty = !isLoading && ads.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Business Ads"
        description="Local businesses pay to advertise inside your mosque app. Add them here — the creatives appear immediately in the mobile app."
        action={
          <Button onClick={() => setDialog({ mode: "add" })}>
            <Plus size={14} />
            Add ad
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          title="No active business ads"
          description="Add a business and upload its 16:9 creative. Ads go live in the mobile app immediately — no review queue."
          ghostRowCaption="Atlas Halal Market · in-feed · $50/mo"
          action={
            <Button onClick={() => setDialog({ mode: "add" })}>
              <Plus size={14} />
              Add your first ad
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {ads.map((ad) => (
              <motion.li
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white"
              >
                {confirmId === ad.id ? (
                  <div className="p-5">
                    <ConfirmInline
                      open
                      message={`Remove the ${ad.businessName} ad?`}
                      onConfirm={() => handleDelete(ad)}
                      onCancel={() => setConfirmId(null)}
                    />
                  </div>
                ) : (
                  <>
                    {ad.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ad.imageUrl}
                        alt={ad.businessName}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-[#0A261E]/[0.04] text-[#0A261E]/35">
                        <Megaphone size={28} />
                      </div>
                    )}

                    <div className="flex items-start gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[16px] text-[#0A261E]">
                          {ad.businessName}
                        </p>
                        <div className="mt-2 space-y-1 text-[12px] text-[#0A261E]/60">
                          {ad.businessAddress ? (
                            <p className="flex items-start gap-1.5">
                              <MapPin size={11} className="mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{ad.businessAddress}</span>
                            </p>
                          ) : null}
                          {ad.contactEmail ? (
                            <p className="flex items-center gap-1.5">
                              <Mail size={11} className="shrink-0" />
                              <span className="truncate">{ad.contactEmail}</span>
                            </p>
                          ) : null}
                          {ad.contactPhone ? (
                            <p className="flex items-center gap-1.5">
                              <Phone size={11} className="shrink-0" />
                              {ad.contactPhone}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]">
                          {ad.placement ? (
                            <span className="rounded-full bg-[#fffbf2] px-2 py-0.5 text-[#B8922A]">
                              {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                            </span>
                          ) : null}
                          {ad.durationMonths ? (
                            <span className="rounded-full bg-[#0A261E]/[0.06] px-2 py-0.5 text-[#0A261E]/70">
                              {ad.durationMonths}{" "}
                              {ad.durationMonths === 1 ? "mo" : "mos"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Ad actions"
                          className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 hover:bg-[#0A261E]/[0.05]"
                        >
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => setDialog({ mode: "edit", ad })}
                          >
                            <Pencil size={13} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmId(ad.id)}
                            className="text-red-600 data-[highlighted]:text-red-600"
                          >
                            <Trash2 size={13} /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog
        open={dialog.mode !== "closed"}
        onOpenChange={(open) => (!open ? setDialog({ mode: "closed" }) : null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[#0A261E]">
              {dialog.mode === "edit" ? "Edit business ad" : "Add a business ad"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#0A261E]/60">
              {dialog.mode === "edit"
                ? "Updates appear in the mobile app immediately."
                : "Upload a 16:9 creative and fill in the business details — the ad goes live as soon as you save."}
            </DialogDescription>
          </DialogHeader>
          <BusinessAdForm
            defaultValues={dialog.mode === "edit" ? dialog.ad : undefined}
            onCancel={() => setDialog({ mode: "closed" })}
            onSubmit={handleSubmit}
            submitLabel={dialog.mode === "edit" ? "Save changes" : "Add ad"}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
