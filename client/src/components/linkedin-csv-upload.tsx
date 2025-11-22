import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function LinkedInCSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { activeOrgId } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleUpload = async () => {
    if (!csvText) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      if (!activeOrgId) {
        toast({
          title: "No organization selected",
          description: "Please select an organization first",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/import/linkedin-csv", { 
        csvText,
        organizationId: activeOrgId 
      });
      const result = await response.json();

      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/graph/stats"] });
      
      toast({
        title: "Import successful",
        description: `Imported ${result.processedPeople} people and ${result.processedCompanies} companies`,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card data-testid="card-csv-upload">
      <CardHeader>
        <CardTitle>Import LinkedIn Connections</CardTitle>
        <CardDescription>
          Upload your LinkedIn Connections CSV export
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-md p-8 text-center hover-elevate cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-csv"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-csv-file"
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Drag and drop your CSV file here, or click to browse
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md" data-testid="file-info">
            <FileText className="h-5 w-5" />
            <span className="text-sm flex-1">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {csvText && !uploadResult && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <pre className="text-xs overflow-x-auto max-h-32">
              {csvText.split('\n').slice(0, 5).join('\n')}
              {csvText.split('\n').length > 5 && '\n...'}
            </pre>
          </div>
        )}

        {uploadResult && (
          <div className={`p-4 rounded-md ${uploadResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`} data-testid="upload-result">
            <div className="flex items-start gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm mb-2">Import Summary</p>
                <ul className="text-sm space-y-1">
                  <li>Total rows: {uploadResult.totalRows}</li>
                  <li>People imported: {uploadResult.processedPeople}</li>
                  <li>Companies imported: {uploadResult.processedCompanies}</li>
                  <li>Connections created: {uploadResult.processedConnections}</li>
                </ul>
                {uploadResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Errors:</p>
                    <ul className="text-xs space-y-1 mt-1">
                      {uploadResult.errors.slice(0, 5).map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>...and {uploadResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!csvText || isUploading}
            className="flex-1"
            data-testid="button-upload"
          >
            {isUploading ? "Importing..." : "Import CSV"}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setCsvText("");
                setUploadResult(null);
              }}
              data-testid="button-clear"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
