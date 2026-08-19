"use client";

import {
    useAlbums,
    useAddPhotosToAlbum,
} from "@/hooks/use-albums";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
    usePreviewAiTransform,
    useApplyAiTransform,
} from "@/hooks/use-ai-transform";
import {
    CheckSquare,
    Image as ImageIcon,
    Upload,
    CloudDownload,
    X,
    ChevronLeft,
    ChevronRight,
    Share2,
    Sparkles,
    Download,
} from "lucide-react";

import {
    usePhotos,
    useUploadPhotos,
    useImageKitAssets,
    useImportImageKitAssets,
    useArchivePhotos,
    useMovePhotosToTrash,
} from "@/hooks/use-photos";

export default function PhotosPage() {

    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectionMode, setSelectionMode] =
        useState(false);

    const [selectedPhotos, setSelectedPhotos] =
        useState<string[]>([]);

    const [importOpen, setImportOpen] =
        useState(false);

    const [selectedAssets, setSelectedAssets] =
        useState<string[]>([]);

    const [viewerIndex, setViewerIndex] =
        useState<number | null>(null);

    const [albumPickerOpen, setAlbumPickerOpen] =
        useState(false);

    const [uploadFiles, setUploadFiles] =
        useState<File[]>([]);

    const [uploadedCount, setUploadedCount] =
        useState(0);

    const [uploadingFileName, setUploadingFileName] =
        useState<string | null>(null);

    const [activityMessage, setActivityMessage] =
        useState<string | null>(null);

    const [aiPanelOpen, setAiPanelOpen] = useState(false);

    const [aiTransformType, setAiTransformType] =
        useState<string | null>(null);

    const [aiPreviewUrl, setAiPreviewUrl] =
        useState<string | null>(null);

    const [aiErrorMessage, setAiErrorMessage] =
        useState<string | null>(null);

    const [aiPrompt, setAiPrompt] =
        useState("");

    const previewAiMutation =
        usePreviewAiTransform();

    const applyAiMutation =
        useApplyAiTransform();

    const [aiWidth, setAiWidth] = useState("1024");
    const [aiHeight, setAiHeight] = useState("1024");
    const [aiFocusObject, setAiFocusObject] = useState("");

    const {
        data,
        isLoading,
        isError,
        error,
    } = usePhotos("ACTIVE");

    const uploadMutation = useUploadPhotos();

    const imageKitAssetsQuery =
        useImageKitAssets(importOpen);

    const importMutation =
        useImportImageKitAssets();

    const archiveMutation =
        useArchivePhotos();

    const trashMutation =
        useMovePhotosToTrash();

    const albumsQuery =
        useAlbums();

    const addToAlbumMutation =
        useAddPhotosToAlbum();

    const photos = data?.content ?? [];

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFiles = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(
            event.target.files ?? [],
        );

        if (files.length === 0) {
            return;
        }

        setUploadFiles(files);
        setUploadedCount(0);
        setUploadingFileName(files[0]?.name ?? null);
        setActivityMessage(null);

        uploadMutation.mutate(
            {
                files,
                onProgress: (
                    completed,
                    total,
                    fileName,
                ) => {
                    setUploadedCount(completed);
                    setUploadingFileName(
                        completed < total
                            ? fileName
                            : null,
                    );
                },
            },
            {
                onSuccess: (uploadedPhotos) => {
                    setUploadFiles([]);
                    setUploadedCount(0);
                    setUploadingFileName(null);

                    setActivityMessage(
                        `${uploadedPhotos.length} ${
                            uploadedPhotos.length === 1
                                ? "photo"
                                : "photos"
                        } added`,
                    );

                    setTimeout(() => {
                        setActivityMessage(null);
                    }, 4000);
                },

                onError: () => {
                    setUploadFiles([]);
                    setUploadedCount(0);
                    setUploadingFileName(null);

                    setActivityMessage(
                        "Some photos could not be uploaded",
                    );
                },
            },
        );

        event.target.value = "";
    };

    const toggleAsset = (fileId: string) => {
        setSelectedAssets((current) =>
            current.includes(fileId)
                ? current.filter(
                    (id) => id !== fileId,
                )
                : [...current, fileId],
        );
    };

    const closeImportDialog = () => {
        if (importMutation.isPending) {
            return;
        }

        setImportOpen(false);
        setSelectedAssets([]);
    };

    const handleImport = () => {
        if (selectedAssets.length === 0) {
            return;
        }

        importMutation.mutate(selectedAssets, {
            onSuccess: () => {
                setImportOpen(false);
                setSelectedAssets([]);
            },
        });
    };

    const togglePhotoSelection = (
        photoId: string,
    ) => {
        setSelectedPhotos((current) =>
            current.includes(photoId)
                ? current.filter(
                    (id) => id !== photoId,
                )
                : [...current, photoId],
        );
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedPhotos([]);
    };

    const handleArchive = () => {
        if (selectedPhotos.length === 0) {
            return;
        }

        archiveMutation.mutate(selectedPhotos, {
            onSuccess: () => {
                exitSelectionMode();
            },
        });
    };

    const handleMoveToTrash = () => {
        if (selectedPhotos.length === 0) {
            return;
        }

        trashMutation.mutate(selectedPhotos, {
            onSuccess: () => {
                exitSelectionMode();
            },
        });
    };

    const handleViewerTrash = () => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        trashMutation.mutate([photo.id], {
            onSuccess: () => {
                setViewerIndex(null);
            },
        });
    };

    const handleShare = async () => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

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
                await navigator.clipboard.writeText(photo.url);
                alert("Photo link copied to clipboard");
            }
        } catch {
            // User cancelled sharing
        }
    };

    const handleDownload = () => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

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

    const handleDownloadPhoto = async () => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        try {
            const response = await fetch(photo.url);

            if (!response.ok) {
                throw new Error("Failed to download photo");
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = photo.fileName;

            document.body.appendChild(link);
            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Photo download failed:",
                error,
            );
        }
    };

    const handleSharePhoto = async () => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title: photo.fileName,
                    text: "Check out this photo",
                    url: photo.url,
                });
            } else {
                await navigator.clipboard.writeText(
                    photo.url,
                );

                alert("Photo link copied to clipboard");
            }
        } catch (error) {
            console.error(
                "Photo sharing failed:",
                error,
            );
        }
    };

    const handleAddToAlbum = (
        albumId: string,
    ) => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        addToAlbumMutation.mutate(
            {
                albumId,
                photoIds: [photo.id],
            },
            {
                onSuccess: () => {
                    setAlbumPickerOpen(false);
                },
            },
        );
    };

    const handlePhotoClick = (
        event: React.MouseEvent<HTMLDivElement>,
        index: number,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (selectionMode) {
            togglePhotoSelection(photos[index].id);
            return;
        }

        setViewerIndex(index);
    };

    const closePhotoViewer = () => {
        setViewerIndex(null);
        setAlbumPickerOpen(false);
    };

    const showPreviousPhoto = () => {
        if (
            viewerIndex === null ||
            photos.length === 0
        ) {
            return;
        }

        setViewerIndex(
            viewerIndex === 0
                ? photos.length - 1
                : viewerIndex - 1,
        );

        setAlbumPickerOpen(false);
    };

    const buildAiRequestBody = (type: string) => {
        return {
            type,

            ...(aiPrompt.trim()
                ? { prompt: aiPrompt.trim() }
                : {}),

            ...(
                type === "SMART_CROP" ||
                type === "GENERATIVE_FILL"
                    ? {
                        width: Number(aiWidth),
                        height: Number(aiHeight),
                    }
                    : {}
            ),

            ...(
                type === "OBJECT_CROP" &&
                aiFocusObject.trim()
                    ? {
                        focusObject: aiFocusObject.trim(),
                    }
                    : {}
            ),
        };
    };

    const handleAiTransform = (
        type: string,
    ) => {
        if (viewerIndex === null) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        setAiTransformType(type);
        setAiPreviewUrl(null);
        setAiErrorMessage(null);

        previewAiMutation.mutate(
            {
                photoId: photo.id,
                body: {
                    type,

                    ...(aiPrompt.trim()
                        ? {
                            prompt: aiPrompt.trim(),
                        }
                        : {}),

                    ...(type === "GENERATIVE_FILL" ||
                    type === "SMART_CROP"
                        ? {
                            width: Number(aiWidth),
                            height: Number(aiHeight),
                        }
                        : {}),

                    ...(type === "OBJECT_CROP" &&
                    aiFocusObject.trim()
                        ? {
                            focusObject:
                                aiFocusObject.trim(),
                        }
                        : {}),
                },
            },
            {
                onSuccess: (result) => {
                    setAiErrorMessage(null);

                    setAiPreviewUrl(
                        result.previewUrl,
                    );
                },

                onError: (error) => {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to generate AI preview.";

                    setAiPreviewUrl(null);

                    setAiErrorMessage(message);
                },
            },
        );
    };

    const handleApplyAiTransform = () => {
        if (
            viewerIndex === null ||
            !aiTransformType
        ) {
            return;
        }

        const photo = photos[viewerIndex];

        if (!photo) {
            return;
        }

        setAiErrorMessage(null);

        applyAiMutation.mutate(
            {
                photoId: photo.id,
                body: {
                    type: aiTransformType,

                    ...(aiPrompt.trim()
                        ? {
                            prompt: aiPrompt.trim(),
                        }
                        : {}),

                    ...(aiTransformType ===
                    "GENERATIVE_FILL" ||
                    aiTransformType ===
                    "SMART_CROP"
                        ? {
                            width: Number(aiWidth),
                            height: Number(aiHeight),
                        }
                        : {}),

                    ...(aiTransformType ===
                    "OBJECT_CROP" &&
                    aiFocusObject.trim()
                        ? {
                            focusObject:
                                aiFocusObject.trim(),
                        }
                        : {}),
                },
            },
            {
                onSuccess: () => {
                    setAiPanelOpen(false);
                    setAiTransformType(null);
                    setAiPreviewUrl(null);
                    setAiPrompt("");
                    setAiErrorMessage(null);
                },

                onError: (error) => {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "";

                    if (
                        message.includes("ELIMIT") ||
                        message.toLowerCase().includes(
                            "extension limit",
                        )
                    ) {
                        setAiErrorMessage(
                            "AI usage limit reached. Please try again later.",
                        );
                        return;
                    }

                    setAiErrorMessage(
                        "Failed to save transformed photo. Please try again.",
                    );
                },
            },
        );
    };

    const showNextPhoto = () => {
        if (
            viewerIndex === null ||
            photos.length === 0
        ) {
            return;
        }

        setViewerIndex(
            viewerIndex ===
            photos.length - 1
                ? 0
                : viewerIndex + 1,
        );

        setAlbumPickerOpen(false);
    };

    useEffect(() => {
        if (viewerIndex === null) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (event.key === "Escape") {
                setViewerIndex(null);
                setAlbumPickerOpen(false);
            }

            if (event.key === "ArrowLeft") {
                showPreviousPhoto();
            }

            if (event.key === "ArrowRight") {
                showNextPhoto();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [viewerIndex]);



    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Photos
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        {isLoading
                            ? "Loading your photos..."
                            : `${data?.totalElements ?? 0} photos`}
                    </p>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        type="button"
                        onClick={() => {
                            setSelectionMode(true);
                            setSelectedPhotos([]);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        <CheckSquare className="size-4" />
                        Select photos
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setImportOpen(true)
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        <CloudDownload className="size-4" />
                        Import from ImageKit
                    </button>

                    <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={
                            uploadMutation.isPending
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Upload className="size-4" />

                        {uploadMutation.isPending
                            ? "Uploading..."
                            : "Upload photos"}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                    />
                </div>
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending &&
                uploadFiles.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">
                                    Uploading {uploadFiles.length} files
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {uploadedCount} of{" "}
                                    {uploadFiles.length} completed
                                </p>
                            </div>

                            <div className="text-sm font-medium">
                                {Math.round(
                                    (uploadedCount /
                                        uploadFiles.length) *
                                    100,
                                )}
                                %
                            </div>
                        </div>

                        <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{
                                    width: `${
                                        (uploadedCount /
                                            uploadFiles.length) *
                                        100
                                    }%`,
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            {uploadFiles.map(
                                (file, index) => {
                                    const completed =
                                        index < uploadedCount;

                                    const current =
                                        index === uploadedCount;

                                    return (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2"
                                        >
                                            <div
                                                className={[
                                                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                                    completed
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted",
                                                ].join(" ")}
                                            >
                                                {completed ? (
                                                    "✓"
                                                ) : (
                                                    <Upload className="size-4" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {file.name}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {completed
                                                        ? "Uploaded"
                                                        : current
                                                            ? "Uploading..."
                                                            : "Waiting..."}
                                                </p>
                                            </div>

                                            {completed && (
                                                <span className="text-xs font-medium text-primary">
                                        100%
                                    </span>
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>

                        {uploadingFileName && (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Uploading: {uploadingFileName}
                            </p>
                        )}
                    </div>
                )}

            {/* Activity Message */}
            {activityMessage && (
                <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            ✓
                        </div>

                        <p className="text-sm font-medium">
                            {activityMessage}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setActivityMessage(null)
                        }
                        className="rounded-full p-1 hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
                    <p className="font-medium text-destructive">
                        Your session has expired. Please log in again.
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
                    {Array.from({
                        length: 6,
                    }).map((_, index) => (
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
                            No photos yet
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Upload images from your computer.
                            They will be stored in ImageKit and
                            appear here.
                        </p>

                        <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={
                                uploadMutation.isPending
                            }
                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Upload className="size-4" />
                            Upload photos
                        </button>
                    </div>
                )}

            {/* Selection Toolbar */}
            {selectionMode && (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">

                    <p className="text-sm font-medium">
                        {selectedPhotos.length} selected
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            onClick={handleMoveToTrash}
                            disabled={
                                selectedPhotos.length === 0 ||
                                trashMutation.isPending ||
                                archiveMutation.isPending
                            }
                            className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {trashMutation.isPending
                                ? "Moving..."
                                : "Move to Trash"}
                        </button>

                        <button
                            type="button"
                            onClick={handleArchive}
                            disabled={
                                selectedPhotos.length === 0 ||
                                archiveMutation.isPending
                            }
                            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {archiveMutation.isPending
                                ? "Archiving..."
                                : "Archive"}
                        </button>

                        <button
                            type="button"
                            onClick={exitSelectionMode}
                            disabled={
                                archiveMutation.isPending
                            }
                            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            {!isLoading &&
                !isError &&
                photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

                        {photos.map(
                            (photo, index) => (
                                <div
                                    key={photo.id}
                                    onClick={() => {
                                        if (selectionMode) {
                                            togglePhotoSelection(photo.id);
                                            return;
                                        }

                                        router.push(`/photos/${photo.id}`);
                                    }}
                                    className={[
                                        "group relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted",
                                        selectionMode
                                            ? "cursor-pointer"
                                            : "cursor-zoom-in",
                                        selectedPhotos.includes(
                                            photo.id,
                                        )
                                            ? "ring-4 ring-primary"
                                            : "",
                                    ].join(" ")}
                                >
                                    {selectionMode && (
                                        <div className="absolute left-3 top-3 z-10">
                                            <div
                                                className={[
                                                    "flex size-6 items-center justify-center rounded-full border-2",
                                                    selectedPhotos.includes(
                                                        photo.id,
                                                    )
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-white bg-black/30",
                                                ].join(" ")}
                                            >
                                                {selectedPhotos.includes(
                                                    photo.id,
                                                ) && (
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
                            ),
                        )}
                    </div>
                )}

            {/* Import Dialog */}
            {importOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div className="w-full max-w-4xl rounded-3xl border border-border bg-background shadow-2xl">

                        <div className="flex items-center justify-between border-b border-border px-6 py-4">

                            <div>
                                <h2 className="text-lg font-semibold">
                                    Import from ImageKit
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Select photos already stored in ImageKit.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeImportDialog
                                }
                                disabled={
                                    importMutation.isPending
                                }
                                className="rounded-full p-2 hover:bg-muted disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-6">

                            {imageKitAssetsQuery.isLoading && (
                                <div className="py-16 text-center text-sm text-muted-foreground">
                                    Loading ImageKit assets...
                                </div>
                            )}

                            {imageKitAssetsQuery.isError && (
                                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">

                                    <p className="font-medium text-destructive">
                                        Failed to load ImageKit assets.
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {imageKitAssetsQuery.error instanceof Error
                                            ? imageKitAssetsQuery.error.message
                                            : "Something went wrong."}
                                    </p>
                                </div>
                            )}

                            {!imageKitAssetsQuery.isLoading &&
                                !imageKitAssetsQuery.isError &&
                                imageKitAssetsQuery.data?.length === 0 && (
                                    <div className="py-16 text-center">

                                        <ImageIcon className="mx-auto size-10 text-muted-foreground" />

                                        <p className="mt-3 font-medium">
                                            No ImageKit assets found
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Upload photos first to ImageKit.
                                        </p>
                                    </div>
                                )}

                            {!imageKitAssetsQuery.isLoading &&
                                !imageKitAssetsQuery.isError &&
                                imageKitAssetsQuery.data &&
                                imageKitAssetsQuery.data.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                                        {imageKitAssetsQuery.data.map(
                                            (asset) => {
                                                const selected =
                                                    selectedAssets.includes(
                                                        asset.fileId,
                                                    );

                                                return (
                                                    <button
                                                        key={asset.fileId}
                                                        type="button"
                                                        disabled={
                                                            asset.alreadyImported
                                                        }
                                                        onClick={() =>
                                                            !asset.alreadyImported &&
                                                            toggleAsset(
                                                                asset.fileId,
                                                            )
                                                        }
                                                        className={[
                                                            "group relative overflow-hidden rounded-2xl border bg-muted text-left transition",
                                                            selected
                                                                ? "border-primary ring-2 ring-primary"
                                                                : "border-border/60",
                                                            asset.alreadyImported
                                                                ? "cursor-not-allowed opacity-50"
                                                                : "hover:border-primary/60",
                                                        ].join(" ")}
                                                    >

                                                        <div className="relative aspect-square">

                                                            <Image
                                                                src={
                                                                    asset.thumbnailUrl ||
                                                                    asset.url
                                                                }
                                                                alt={
                                                                    asset.fileName
                                                                }
                                                                fill
                                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                                className="object-cover"
                                                            />

                                                            {selected && (
                                                                <div className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                                    <CheckSquare className="size-4" />
                                                                </div>
                                                            )}

                                                            {asset.alreadyImported && (
                                                                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1.5 text-center text-xs text-white">
                                                                    Already imported
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="truncate px-3 py-2 text-xs">
                                                            {
                                                                asset.fileName
                                                            }
                                                        </div>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                        </div>

                        <div className="flex items-center justify-between border-t border-border px-6 py-4">

                            <p className="text-sm text-muted-foreground">
                                {selectedAssets.length} selected
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={
                                        closeImportDialog
                                    }
                                    disabled={
                                        importMutation.isPending
                                    }
                                    className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={
                                        selectedAssets.length === 0 ||
                                        importMutation.isPending
                                    }
                                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {importMutation.isPending
                                        ? "Importing..."
                                        : `Import ${selectedAssets.length} ${
                                            selectedAssets.length ===
                                            1
                                                ? "photo"
                                                : "photos"
                                        }`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PHOTO VIEWER */}
            {viewerIndex !== null &&
                photos[viewerIndex] && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                        onClick={
                            closePhotoViewer
                        }
                    >
                        {/* Close */}
                        <button
                            type="button"
                            onClick={
                                closePhotoViewer
                            }
                            className="absolute right-5 top-5 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                        >
                            <X className="size-6" />
                        </button>

                        {/* Previous */}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                showPreviousPhoto();
                            }}
                            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                        >
                            <ChevronLeft className="size-7" />
                        </button>

                        {/* Viewer Content */}
                        <div
                            className="flex max-h-[90vh] max-w-[90vw] flex-col items-center"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            {/* Image */}
                            <Image
                                src={
                                    photos[viewerIndex]
                                        .url ||
                                    photos[viewerIndex]
                                        .thumbnailUrl
                                }
                                alt={
                                    photos[viewerIndex]
                                        .fileName
                                }
                                width={1600}
                                height={1200}
                                className="max-h-[70vh] w-auto rounded-xl object-contain"
                            />

                            {/* Photo Information */}
                            <div className="mt-4 w-full max-w-2xl rounded-2xl bg-black/60 px-5 py-4 text-white backdrop-blur">

                                <p className="truncate text-sm font-semibold">
                                    {
                                        photos[
                                            viewerIndex
                                            ].fileName
                                    }
                                </p>

                                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/70 sm:grid-cols-4">

                                    <div>
                                        <p className="text-white/40">
                                            Type
                                        </p>

                                        <p className="mt-1 truncate">
                                            {
                                                photos[
                                                    viewerIndex
                                                    ].mimeType
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-white/40">
                                            Size
                                        </p>

                                        <p className="mt-1">
                                            {(
                                                photos[
                                                    viewerIndex
                                                    ].sizeBytes /
                                                (1024 *
                                                    1024)
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-white/40">
                                            Dimensions
                                        </p>

                                        <p className="mt-1">
                                            {photos[
                                                viewerIndex
                                                ].width &&
                                            photos[
                                                viewerIndex
                                                ].height
                                                ? `${photos[viewerIndex].width} × ${photos[viewerIndex].height}`
                                                : "Unknown"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-white/40">
                                            Added
                                        </p>

                                        <p className="mt-1">
                                            {new Date(
                                                photos[
                                                    viewerIndex
                                                    ].createdAt,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/50 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/70"
                                >
                                    <Share2 className="size-4" />
                                    Share
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/50 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/70"
                                >
                                    <Download className="size-4" />
                                    Download
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAiPanelOpen(true);
                                        setAiTransformType(null);
                                        setAiPreviewUrl(null);
                                        setAiPrompt("");
                                    }}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    <Sparkles className="size-4" />
                                    AI Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAlbumPickerOpen(true)}
                                    className="rounded-full border border-white/30 bg-black/50 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/70"
                                >
                                    Add to Album
                                </button>

                                <button
                                    type="button"
                                    onClick={handleViewerTrash}
                                    disabled={trashMutation.isPending}
                                    className="rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {trashMutation.isPending
                                        ? "Moving..."
                                        : "Move to Trash"}
                                </button>

                            </div>

                            {/* Album Picker */}
                            {albumPickerOpen && (
                                <div className="mt-4 w-full max-w-md rounded-2xl bg-black/80 p-4 text-white backdrop-blur">

                                    <div className="mb-3 flex items-center justify-between">

                                        <h3 className="font-semibold">
                                            Add to Album
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAlbumPickerOpen(
                                                    false,
                                                )
                                            }
                                            className="rounded-full p-1 hover:bg-white/10"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>

                                    {albumsQuery.isLoading && (
                                        <p className="py-4 text-center text-sm text-white/60">
                                            Loading albums...
                                        </p>
                                    )}

                                    {albumsQuery.isError && (
                                        <p className="py-4 text-center text-sm text-red-300">
                                            Failed to load albums.
                                        </p>
                                    )}

                                    {!albumsQuery.isLoading &&
                                        !albumsQuery.isError &&
                                        albumsQuery.data?.length ===
                                        0 && (
                                            <p className="py-4 text-center text-sm text-white/60">
                                                No albums yet.
                                            </p>
                                        )}

                                    <div className="max-h-60 space-y-2 overflow-y-auto">

                                        {albumsQuery.data?.map(
                                            (album) => (
                                                <button
                                                    key={
                                                        album.id
                                                    }
                                                    type="button"
                                                    disabled={
                                                        addToAlbumMutation.isPending
                                                    }
                                                    onClick={() =>
                                                        handleAddToAlbum(
                                                            album.id,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-white/10 disabled:opacity-50"
                                                >
                                                    <span>
                                                        {
                                                            album.title
                                                        }
                                                    </span>

                                                    <span className="text-xs text-white/50">
                                                        {
                                                            album.photoCount
                                                        }{" "}
                                                        photos
                                                    </span>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {aiPanelOpen && (
                            <div className="mt-4 w-full max-w-2xl rounded-2xl bg-black/90 p-5 text-white backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            AI Features
                                        </h3>

                                        <p className="text-sm text-white/60">
                                            Transform your photo with ImageKit AI
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAiPanelOpen(false);
                                            setAiTransformType(null);
                                            setAiPreviewUrl(null);
                                            setAiPrompt("");
                                        }}
                                        className="rounded-full p-2 hover:bg-white/10"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>

                                {/* AI Features */}
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {[
                                        {
                                            type: "REMOVE_BACKGROUND",
                                            label: "Remove Background",
                                        },
                                        {
                                            type: "BACKGROUND_AND_SHADOW",
                                            label: "Background + Shadow",
                                        },
                                        {
                                            type: "CHANGE_BACKGROUND",
                                            label: "Change Background",
                                        },
                                        {
                                            type: "GENERATIVE_FILL",
                                            label: "Generative Fill",
                                        },
                                        {
                                            type: "SMART_CROP",
                                            label: "Smart Crop",
                                        },
                                        {
                                            type: "OBJECT_CROP",
                                            label: "Object Crop",
                                        },
                                        {
                                            type: "RETOUCH",
                                            label: "Retouch",
                                        },
                                        {
                                            type: "UPSCALE",
                                            label: "Upscale",
                                        },
                                        {
                                            type: "AI_EDIT",
                                            label: "AI Edit",
                                        },
                                    ].map((feature) => (
                                        <button
                                            key={feature.type}
                                            type="button"
                                            onClick={() => {
                                                setAiTransformType(feature.type);
                                                setAiPreviewUrl(null);
                                                setAiErrorMessage(null);
                                            }}
                                            disabled={
                                                previewAiMutation.isPending ||
                                                applyAiMutation.isPending
                                            }
                                            className={[
                                                "rounded-xl border px-3 py-3 text-left text-sm transition",
                                                aiTransformType ===
                                                feature.type
                                                    ? "border-primary bg-primary/20"
                                                    : "border-white/10 bg-white/5 hover:bg-white/10",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="size-4" />

                                                <span>
                            {feature.label}
                        </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Prompt */}
                                {(aiTransformType ===
                                    "CHANGE_BACKGROUND" ||
                                    aiTransformType ===
                                    "GENERATIVE_FILL" ||
                                    aiTransformType ===
                                    "AI_EDIT") && (
                                    <div className="mt-4">
                                        <label className="mb-2 block text-sm font-medium">
                                            Describe what you want
                                        </label>

                                        <textarea
                                            value={aiPrompt}
                                            onChange={(event) =>
                                                setAiPrompt(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Describe the transformation..."
                                            className="min-h-[90px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
                                        />
                                    </div>
                                )}

                                {(aiTransformType === "SMART_CROP" ||
                                    aiTransformType === "GENERATIVE_FILL") && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            min="64"
                                            max="4096"
                                            value={aiWidth}
                                            onChange={(e) => setAiWidth(e.target.value)}
                                            placeholder="Width"
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />

                                        <input
                                            type="number"
                                            min="64"
                                            max="4096"
                                            value={aiHeight}
                                            onChange={(e) => setAiHeight(e.target.value)}
                                            placeholder="Height"
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}

                                {aiTransformType === "OBJECT_CROP" && (
                                    <input
                                        type="text"
                                        value={aiFocusObject}
                                        onChange={(e) => setAiFocusObject(e.target.value)}
                                        placeholder="Object to crop, e.g. person, dog, car"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    />
                                )}

                                {aiTransformType && (
                                    <button
                                        type="button"
                                        onClick={() => handleAiTransform(aiTransformType)}
                                        disabled={previewAiMutation.isPending}
                                        className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {previewAiMutation.isPending
                                            ? "Generating AI Preview..."
                                            : "Generate AI Preview"}
                                    </button>
                                )}

                                {/* Preview */}
                                {previewAiMutation.isPending && (
                                    <div className="mt-5 rounded-xl bg-white/5 p-6 text-center">
                                        <p className="text-sm text-white/60">
                                            Generating AI preview...
                                        </p>
                                    </div>
                                )}

                                {previewAiMutation.isError && (
                                    <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4">
                                        <p className="text-sm text-red-300">
                                            {previewAiMutation.error instanceof
                                            Error
                                                ? previewAiMutation.error.message
                                                : "Failed to generate preview."}
                                        </p>
                                    </div>
                                )}

                                {/* ERROR MESSAGE */}
                                {aiErrorMessage && (
                                    <div className="mt-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-sm text-red-400">
                                        {aiErrorMessage}
                                    </div>
                                )}

                                {aiPreviewUrl && (
                                    <div className="mt-5">
                                        <p className="mb-2 text-sm font-medium">
                                            Preview
                                        </p>

                                        <div className="overflow-hidden rounded-xl bg-white/5">
                                            <img
                                                src={aiPreviewUrl}
                                                alt="AI preview"
                                                className="max-h-[45vh] w-full object-contain"
                                                onError={() => {
                                                    setAiPreviewUrl(null);

                                                    setAiErrorMessage(
                                                        "AI preview failed to load. Please try again later.",
                                                    );
                                                }}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleApplyAiTransform}
                                            disabled={applyAiMutation.isPending}
                                            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {applyAiMutation.isPending
                                                ? "Saving transformed photo..."
                                                : "Apply & Save as New Photo"}
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Next */}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                showNextPhoto();
                            }}
                            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                        >
                            <ChevronRight className="size-7" />
                        </button>
                    </div>
                )}
        </div>
    );
}