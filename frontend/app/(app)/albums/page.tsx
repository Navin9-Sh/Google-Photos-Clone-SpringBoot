"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";

import { useAlbums, useCreateAlbum } from "@/hooks/use-albums";

export default function AlbumsPage() {
    const { data: albums, isLoading, isError } = useAlbums();
    const createAlbumMutation = useCreateAlbum();

    const [title, setTitle] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleCreateAlbum = () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            return;
        }

        createAlbumMutation.mutate(trimmedTitle, {
            onSuccess: () => {
                setTitle("");
                setShowCreateForm(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Albums
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        {isLoading
                            ? "Loading albums..."
                            : `${albums?.length ?? 0} albums`}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateForm((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="size-4" />
                    Create album
                </button>
            </div>

            {/* Create album */}
            {showCreateForm && (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleCreateAlbum();
                                }
                            }}
                            placeholder="Album name"
                            autoFocus
                            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <button
                            type="button"
                            onClick={handleCreateAlbum}
                            disabled={
                                !title.trim() ||
                                createAlbumMutation.isPending
                            }
                            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createAlbumMutation.isPending
                                ? "Creating..."
                                : "Create"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setTitle("");
                                setShowCreateForm(false);
                            }}
                            className="rounded-xl border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
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
                        Failed to load albums.
                    </p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 animate-pulse rounded-2xl bg-muted"
                        />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!isLoading &&
                !isError &&
                (albums?.length ?? 0) === 0 && (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/40 px-6 text-center">
                        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted">
                            <FolderOpen className="size-7 text-muted-foreground" />
                        </div>

                        <h2 className="text-lg font-semibold">
                            No albums yet
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Create an album to organize your photos.
                        </p>
                    </div>
                )}

            {/* Albums */}
            {!isLoading &&
                !isError &&
                (albums?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {albums?.map((album) => (
                            <Link
                                key={album.id}
                                href={`/albums/${album.id}`}
                                className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-border hover:shadow-sm"
                            >
                                <div className="relative h-40 overflow-hidden bg-muted">
                                    {album.coverThumbnailUrl ? (
                                        <img
                                            src={album.coverThumbnailUrl}
                                            alt={album.title}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <FolderOpen className="size-10 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h2 className="truncate font-semibold">
                                        {album.title}
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {album.photoCount} photos
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
        </div>
    );
}