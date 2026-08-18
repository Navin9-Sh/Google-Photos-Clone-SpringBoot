"use client";

import { HardDrive } from "lucide-react";

import { useImageKitAssets } from "@/hooks/use-photos";

function formatBytes(bytes: number) {
    if (bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(
        Math.log(bytes) / Math.log(1024),
    );

    const value =
        bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function StorageWidget() {
    const {
        data: assets = [],
        isLoading,
        isError,
    } = useImageKitAssets(true);

    const totalBytes = assets.reduce(
        (total, asset) =>
            total + (asset.sizeBytes ?? 0),
        0,
    );

    const photoCount = assets.length;

    return (
        <div className="rounded-xl bg-sidebar-accent/40 px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
                <HardDrive className="size-4 text-sidebar-foreground" />

                <p className="text-sm font-medium text-sidebar-foreground">
                    Library storage
                </p>
            </div>

            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full w-[10%] rounded-full bg-primary transition-all"
                />
            </div>

            {isLoading ? (
                <p className="text-xs text-muted-foreground">
                    Calculating storage...
                </p>
            ) : isError ? (
                <p className="text-xs text-destructive">
                    Failed to load storage
                </p>
            ) : (
                <p className="text-xs text-muted-foreground">
                    {formatBytes(totalBytes)} used ·{" "}
                    {photoCount}{" "}
                    {photoCount === 1
                        ? "photo"
                        : "photos"}
                </p>
            )}
        </div>
    );
}