"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";import Link from "next/link";
import { ArrowLeft, CheckSquare,FolderOpen, Image as ImageIcon, Plus,Trash2, } from "lucide-react";
import { useParams } from "next/navigation";

import { useAlbum, useAlbumPhotos, useAddPhotosToAlbum,     useRemovePhotoFromAlbum,useUpdateAlbum, useDeleteAlbum,
} from "@/hooks/use-albums";
import {usePhotos} from "@/hooks/use-photos";

export default function AlbumDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [addMode, setAddMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [removeMode, setRemoveMode] = useState(false);
    const [selectedRemovePhotos, setSelectedRemovePhotos] =
        useState<string[]>([]);
    const [renameMode, setRenameMode] = useState(false);
    const [albumTitle, setAlbumTitle] = useState("");

    const updateAlbumMutation = useUpdateAlbum();

    const removePhotoMutation = useRemovePhotoFromAlbum();
    const deleteAlbumMutation = useDeleteAlbum();
    const router = useRouter();


    const { data: libraryData } = usePhotos("ACTIVE");

    const addPhotosMutation = useAddPhotosToAlbum();

    const libraryPhotos = libraryData?.content ?? [];

    const {
        data: album,
        isLoading: albumLoading,
        isError: albumError,
    } = useAlbum(id);

    const {
        data,
        isLoading: photosLoading,
        isError: photosError,
    } = useAlbumPhotos(id);

    const photos = data?.content ?? [];

    const togglePhotoSelection = (photoId: string) => {
        setSelectedPhotos((current) =>
            current.includes(photoId)
                ? current.filter((id) => id !== photoId)
                : [...current, photoId],
        );
    };

    const closeAddMode = () => {
        setAddMode(false);
        setSelectedPhotos([]);
    };

    const handleAddPhotos = () => {
        if (selectedPhotos.length === 0) {
            return;
        }

        addPhotosMutation.mutate(
            {
                albumId: id,
                photoIds: selectedPhotos,
            },
            {
                onSuccess: () => {
                    closeAddMode();
                },
            },
        );
    };

    const toggleRemovePhotoSelection = (photoId: string) => {
        setSelectedRemovePhotos((current) =>
            current.includes(photoId)
                ? current.filter((id) => id !== photoId)
                : [...current, photoId],
        );
    };

    const handleRenameAlbum = () => {
        const trimmedTitle = albumTitle.trim();

        if (!trimmedTitle) {
            return;
        }

        updateAlbumMutation.mutate(
            {
                id,
                title: trimmedTitle,
            },
            {
                onSuccess: () => {
                    setRenameMode(false);
                },
            },
        );
    };

    const closeRemoveMode = () => {
        setRemoveMode(false);
        setSelectedRemovePhotos([]);
    };

    const handleRemovePhotos = () => {
        if (selectedRemovePhotos.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Remove ${selectedRemovePhotos.length} photo${
                selectedRemovePhotos.length > 1 ? "s" : ""
            } from this album?`,
        );

        if (!confirmed) {
            return;
        }

        const removeNext = (index: number) => {
            if (index >= selectedRemovePhotos.length) {
                closeRemoveMode();
                return;
            }

            removePhotoMutation.mutate(
                {
                    albumId: id,
                    photoId: selectedRemovePhotos[index],
                },
                {
                    onSuccess: () => {
                        removeNext(index + 1);
                    },
                },
            );
        };

        removeNext(0);
    };

    const handleDeleteAlbum = () => {
        const confirmed = window.confirm(
            `Delete "${album?.title ?? "this album"}"? The photos themselves will not be deleted.`,
        );

        if (!confirmed) {
            return;
        }

        deleteAlbumMutation.mutate(id, {
            onSuccess: () => {
                router.push("/albums");
            },
        });
    };


    const isLoading = albumLoading || photosLoading;
    const isError = albumError || photosError;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/albums"
                        className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>

                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <FolderOpen className="size-5 text-muted-foreground" />

                            <h1 className="truncate text-3xl font-semibold tracking-tight">
                                {album?.title ?? "Album"}
                            </h1>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {isLoading
                                ? "Loading..."
                                : `${data?.totalElements ?? 0} photos`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setAlbumTitle(album?.title ?? "");
                            setRenameMode(true);
                        }}
                        className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
                    >
                        Rename
                    </button>

                    <button
                        type="button"
                        onClick={handleDeleteAlbum}
                        disabled={deleteAlbumMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                        {deleteAlbumMutation.isPending
                            ? "Deleting..."
                            : "Delete album"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setRemoveMode(true);
                            setSelectedRemovePhotos([]);
                        }}
                        disabled={photos.length === 0}
                        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Trash2 className="size-4" />
                        Remove photos
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setAddMode(true);
                            setSelectedPhotos([]);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        Add photos
                    </button>
                </div>
            </div>

            {/* Rename form */}
            {renameMode && (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={albumTitle}
                            onChange={(event) =>
                                setAlbumTitle(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleRenameAlbum();
                                }
                            }}
                            autoFocus
                            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <button
                            type="button"
                            onClick={handleRenameAlbum}
                            disabled={
                                !albumTitle.trim() ||
                                updateAlbumMutation.isPending
                            }
                            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {updateAlbumMutation.isPending
                                ? "Saving..."
                                : "Save"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setRenameMode(false)}
                            disabled={updateAlbumMutation.isPending}
                            className="rounded-xl border border-border px-5 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}



            {addMode && (
                <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            {selectedPhotos.length} selected
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAddPhotos}
                                disabled={
                                    selectedPhotos.length === 0 ||
                                    addPhotosMutation.isPending
                                }
                                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {addPhotosMutation.isPending
                                    ? "Adding..."
                                    : "Add to album"}
                            </button>

                            <button
                                type="button"
                                onClick={closeAddMode}
                                disabled={addPhotosMutation.isPending}
                                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {libraryPhotos.map((photo) => {
                            const selected = selectedPhotos.includes(photo.id);

                            return (
                                <div
                                    key={photo.id}
                                    onClick={() =>
                                        togglePhotoSelection(photo.id)
                                    }
                                    className={[
                                        "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-muted",
                                        selected
                                            ? "ring-4 ring-primary"
                                            : "",
                                    ].join(" ")}
                                >
                                    <Image
                                        src={
                                            photo.thumbnailUrl ||
                                            photo.url
                                        }
                                        alt={photo.fileName}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw)"
                                        className="object-cover"
                                    />

                                    <div className="absolute left-3 top-3 z-10">
                                        <div
                                            className={[
                                                "flex size-6 items-center justify-center rounded-full border-2",
                                                selected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-white bg-black/30",
                                            ].join(" ")}
                                        >
                                            {selected && (
                                                <CheckSquare className="size-4" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Remove photos panel */}
            {removeMode && (
                <div className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            {selectedRemovePhotos.length} selected
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRemovePhotos}
                                disabled={
                                    selectedRemovePhotos.length === 0 ||
                                    removePhotoMutation.isPending
                                }
                                className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="size-4" />

                                {removePhotoMutation.isPending
                                    ? "Removing..."
                                    : "Remove from album"}
                            </button>

                            <button
                                type="button"
                                onClick={closeRemoveMode}
                                disabled={removePhotoMutation.isPending}
                                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {photos.map((photo) => {
                            const selected =
                                selectedRemovePhotos.includes(photo.id);

                            return (
                                <div
                                    key={photo.id}
                                    onClick={() =>
                                        toggleRemovePhotoSelection(photo.id)
                                    }
                                    className={[
                                        "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-muted",
                                        selected ? "ring-4 ring-destructive" : "",
                                    ].join(" ")}
                                >
                                    <Image
                                        src={
                                            photo.thumbnailUrl ||
                                            photo.url
                                        }
                                        alt={photo.fileName}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw)"
                                        className="object-cover"
                                    />

                                    <div className="absolute left-3 top-3 z-10">
                                        <div
                                            className={[
                                                "flex size-6 items-center justify-center rounded-full border-2",
                                                selected
                                                    ? "border-destructive bg-destructive text-destructive-foreground"
                                                    : "border-white bg-black/30",
                                            ].join(" ")}
                                        >
                                            {selected && (
                                                <CheckSquare className="size-4" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Error */}
            {isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
                    <p className="font-medium text-destructive">
                        Failed to load album.
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

            {/* Empty */}
            {!isLoading &&
                !isError &&
                photos.length === 0 && (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/40 px-6 text-center">
                        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted">
                            <ImageIcon className="size-7 text-muted-foreground" />
                        </div>

                        <h2 className="text-lg font-semibold">
                            No photos in this album
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Photos added to this album will appear here.
                        </p>
                    </div>
                )}

            {/* Photos */}
            {!isLoading &&
                !isError &&
                photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted"
                            >
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
                        ))}
                    </div>
                )}
        </div>
    );
}