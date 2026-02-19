"use client"

import * as React from "react"
import { UploadCloud, FileSpreadsheet, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

interface FileDropzoneProps {
    onFileSelect: (file: File) => void
    isProcessing?: boolean
}

export function FileDropzone({ onFileSelect, isProcessing }: FileDropzoneProps) {
    const [isDragActive, setIsDragActive] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDrag = React.useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true)
        } else if (e.type === "dragleave") {
            setIsDragActive(false)
        }
    }, [])

    const handleDrop = React.useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (validateFile(file)) {
                handleFileSelection(file)
            }
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (validateFile(file)) {
                handleFileSelection(file)
            }
        }
    }

    const validateFile = (file: File) => {
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv"
        ]
        if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            alert("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.")
            return false
        }
        return true
    }

    const handleFileSelection = (file: File) => {
        setSelectedFile(file)
        onFileSelect(file)
    }

    const clearFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            {!selectedFile ? (
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden group",
                        isDragActive
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-border/40 bg-background/50 hover:bg-muted/30",
                        isProcessing && "pointer-events-none opacity-50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleChange}
                        disabled={isProcessing}
                    />

                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <div className={cn(
                            "p-4 rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110",
                            isDragActive && "bg-primary/20"
                        )}>
                            <UploadCloud className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-foreground">
                                엑셀 파일을 이곳에 드래그하세요
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                또는 클릭하여 파일 선택 (.xlsx, .xls)
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex items-center gap-4 p-4 bg-background/50 border rounded-2xl backdrop-blur-sm animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFile}
                        disabled={isProcessing}
                        className="hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    )
}
