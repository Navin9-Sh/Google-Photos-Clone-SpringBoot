"use client";

import Image from "next/image";
import { useState } from "react";
import {
    CheckSquare,
    Image as ImageIcon,
    RotateCcw,
    Trash2,
} from "lucide-react";

import {
    usePhotos,
    useRestorePhotos,
    usePermanentlyDeletePhotos,
} from "@/hooks/use-photos";

export default function TrashPage() {
    const {
        data,
        isLoading,
        isError,
        error,
    } = usePhotos("TRASH");

    const photos = data?.content ?? [];

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

    const restoreMutation = useRestorePhotos();
    const deleteMutation = usePermanentlyDeletePhotos();

    const togglePhotoSelection = (photoId: string) => {
        setSelectedPhotos((current) =>
            current.includes(photoId)
                ? current.filter((id) => id !== photoId)
                : [...current, photoId],
        );
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedPhotos([]);
    };

    const handleRestore = () => {
        if (selectedPhotos.length === 0) {
            return;
        }

        restoreMutation.mutate(selectedPhotos, {
            onSuccess: () => {
                exitSelectionMode();
            },
        });
    };

    const handlePermanentDelete = () => {
        if (selectedPhotos.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Permanently delete ${selectedPhotos.length} photo${
                selectedPhotos.length > 1 ? "s" : ""
            }? This cannot be undone.`,
        );

        if (!confirmed) {
            return;
        }

        deleteMutation.mutate(selectedPhotos, {
            onSuccess: () => {
                exitSelectionMode();
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                            <Trash2 className="size-5 text-muted-foreground" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Trash
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                {isLoading
                                    ? "Loading trash..."
                                    : `${data?.totalElements ?? 0} photos`}
                            </p>
                        </div>
                    </div>
                </div>

                {!isLoading && photos.length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectionMode(true);
                            setSelectedPhotos([]);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                        <CheckSquare className="size-4" />
                        Select photos
                    </button>
                )}
            </div>

            {/* Selection toolbar */}
            {selectionMode && (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium">
                        {selectedPhotos.length} selected
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            onClick={handlePermanentDelete}
                            disabled={
                                selectedPhotos.length === 0 ||
                                restoreMutation.isPending ||
                                deleteMutation.isPending
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete permanently"}
                        </button>

                        <button
                            type="button"
                            onClick={handleRestore}
                            disabled={
                                selectedPhotos.length === 0 ||
                                restoreMutation.isPending
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="size-4" />

                            {restoreMutation.isPending
                                ? "Restoring..."
                                : "Restore"}
                        </button>

                        <button
                            type="button"
                            onClick={exitSelectionMode}
                            disabled={restoreMutation.isPending}
                            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
                    <p className="font-medium text-destructive">
                        Failed to load trash.
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {error instanceof Error
                            ? error.message
                            : "Something went wrong."}
                    </p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-square animate-pulse rounded-2xl bg-muted"
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading &&
                !isError &&
                photos.length === 0 && (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/40 px-6 text-center">
                        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted">
                            <Trash2 className="size-7 text-muted-foreground" />
                        </div>

                        <h2 className="text-lg font-semibold">
                            Trash is empty
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Photos you move to trash will appear here.
                        </p>
                    </div>
                )}

            {/* Photo grid */}
            {!isLoading &&
                !isError &&
                photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {photos.map((photo) => {
                            const isSelected =
                                selectedPhotos.includes(photo.id);

                            return (
                                <div
                                    key={photo.id}
                                    onClick={() =>
                                        selectionMode &&
                                        togglePhotoSelection(photo.id)
                                    }
                                    className={[
                                        "group relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted",
                                        selectionMode
                                            ? "cursor-pointer"
                                            : "",
                                        isSelected
                                            ? "ring-4 ring-primary"
                                            : "",
                                    ].join(" ")}
                                >
                                    {selectionMode && (
                                        <div className="absolute left-3 top-3 z-10">
                                            <div
                                                className={[
                                                    "flex size-6 items-center justify-center rounded-full border-2",
                                                    isSelected
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-white bg-black/30",
                                                ].join(" ")}
                                            >
                                                {isSelected && (
                                                    <CheckSquare className="size-4" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Image
                                        src={
                                            photo.thumbnailUrl ||
                                            photo.url
                                        }
                                        alt={photo.fileName}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw)"
                                        className="object-cover transition duration-300 group-hover:scale-105"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
        </div>
    );
}