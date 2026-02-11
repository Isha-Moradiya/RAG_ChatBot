import React, { useState } from "react";
import {
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneratedFile, downloadFile } from "../utils/fileGenerateService";

interface GeneratedFilePreviewProps {
  generatedFile: GeneratedFile;
  onRegenerate: () => void;
  onRemove?: () => void;
  isRegenerating?: boolean;
}

export const GeneratedFilePreview: React.FC<GeneratedFilePreviewProps> = ({
  generatedFile,
  onRegenerate,
  onRemove,
  isRegenerating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getGenerationTypeLabel = (type: string) => {
    switch (type) {
      case "research":
        return "Research Paper";
      case "mcq":
        return "MCQ Sheet";
      case "documentation":
        return "Documentation";
      default:
        return "Generated Document";
    }
  };

  const getGenerationTypeColor = (type: string) => {
    switch (type) {
      case "research":
        return "bg-green-500";
      case "mcq":
        return "bg-blue-500";
      case "documentation":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDownload = () => {
    downloadFile(generatedFile);
  };

  const handlePreview = () => {
    if (generatedFile.type === "application/pdf") {
      // Open PDF in new tab for preview
      window.open(generatedFile.url, "_blank");
    } else {
      setIsPreviewOpen(true);
    }
  };

  return (
    <div className="bg-[#303134] border border-[#444649] rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-[#444649]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 ${getGenerationTypeColor(
                generatedFile.generationType
              )} rounded-lg flex items-center justify-center`}
            >
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-100">
                  {getGenerationTypeLabel(generatedFile.generationType)}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${getGenerationTypeColor(
                    generatedFile.generationType
                  )} text-white`}
                >
                  {generatedFile.generationType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Generated at {formatTime(generatedFile.timestamp)} •{" "}
                {formatFileSize(generatedFile.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 hover:bg-[#444649]"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {onRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">File Name:</span>
              <p className="text-gray-100 truncate">{generatedFile.name}</p>
            </div>
            <div>
              <span className="text-gray-400">File Type:</span>
              <p className="text-gray-100">{generatedFile.type}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#444649]">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreview}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 hover:bg-[#444649] flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>

              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <Button
              onClick={onRegenerate}
              disabled={isRegenerating}
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`}
              />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>

          {/* Preview Modal */}
          {isPreviewOpen && generatedFile.type !== "application/pdf" && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#303134] border border-[#444649] rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-100">
                    Preview: {generatedFile.name}
                  </h3>
                  <Button
                    onClick={() => setIsPreviewOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <iframe
                  src={generatedFile.url}
                  className="w-full h-96 border border-[#444649] rounded"
                  title="File Preview"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
