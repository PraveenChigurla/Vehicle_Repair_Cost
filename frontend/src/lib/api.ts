import { AnalysisResponse } from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeVehicleImage(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // Ignore json parse error
      }
      throw new Error(errorMessage);
    }

    const data: AnalysisResponse = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Analysis request failed:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to analyze image. Please check your connection.");
    }
    throw new Error("Failed to analyze image. Please check your connection.");
  }
}

export function getImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface SystemHealth {
  status: string;
  yolo: boolean;
  severity_model: boolean;
  cost_model: boolean;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!response.ok) throw new Error("Health check failed");
    return await response.json();
  } catch {
    return {
      status: "unhealthy",
      yolo: false,
      severity_model: false,
      cost_model: false
    };
  }
}
