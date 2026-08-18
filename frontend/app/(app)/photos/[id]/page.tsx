"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Download,
    Info,
    Share2,
    Sparkles,
} from "lucide-react";

import { usePhotos } from "@/hooks/use-photos";
import type { Photo } from "@/lib/api";

function formatFileSize(bytes?: number | null) {
    if (bytes === null || bytes === undefined) {
        return "Unknown";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;

    return `${mb.toFixed(2)} MB`;
}

export default function PhotoDetailsPage() {
    const router = useRouter();
    const params = useParams();

    const photoId =
        typeof params.id === "string"
            ? params.id
            : "";

    const {
        data: photosResponse,
        isLoading,
        isError,
    } = usePhotos("ACTIVE", 0, 100);

    const photo: Photo | undefined = useMemo(() => {
        return photosResponse?.content?.find(
            (item) => item.id === photoId,
        );
    }, [photosResponse, photoId]);

    const handleShare = async () => {
        if (!photo) {
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title: photo.fileName,
                    text: `Check out ${photo.fileName}`,
                    url: photo.url,
                });
            } else {
                await navigator.clipboard.writeText(
                    photo.url,
                );

                alert("Photo link copied to clipboard");
            }
        } catch {
            // User cancelled sharing
        }
    };

    const handleDownload = () => {
        if (!photo) {
            return;
        }

        const link = document.createElement("a");

        link.href = photo.url;
        link.download = photo.fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading photo...
                </p>
            </div>
        );
    }

    if (isError || !photo) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                    Photo could not be found.
                </p>

                <button
                    type="button"
                    onClick={() => router.push("/photos")}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                >
                    Back to Photos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={() => router.push("/photos")}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Photos
                </button>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                        <Share2 className="size-4" />
                        Share
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                        <Download className="size-4" />
                        Download
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                `/photos/${photo.id}/ai`,
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Sparkles className="size-4" />
                        AI Edit
                    </button>
                </div>
            </div>

            {/* Photo + Details */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

                {/* Image */}
                <div className="flex min-h-[70vh] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black/20 p-5">
                    <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="max-h-[75vh] max-w-full object-contain"
                    />
                </div>

                {/* Details */}
                <aside className="h-fit rounded-2xl border border-border bg-card p-5">
                    <div className="mb-5 flex items-center gap-2">
                        <Info className="size-5 text-primary" />

                        <h2 className="font-semibold">
                            Photo details
                        </h2>
                    </div>

                    <div className="space-y-5">

                        <div>
                            <p className="text-xs text-muted-foreground">
                                File name
                            </p>

                            <p className="mt-1 break-all text-sm font-medium">
                                {photo.fileName}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                File type
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {photo.mimeType ?? "Unknown"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                File size
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {formatFileSize(photo.sizeBytes)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Dimensions
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {photo.width ?? "?"} ×{" "}
                                {photo.height ?? "?"} px
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Added
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {photo.createdAt
                                    ? new Date(
                                        photo.createdAt,
                                    ).toLocaleString()
                                    : "Unknown"}
                            </p>
                        </div>

                    </div>
                </aside>

            </div>
        </div>
    );
}