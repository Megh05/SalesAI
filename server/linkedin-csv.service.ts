import { graphStorage } from "./graph.storage";
import type { InsertGraphNode, InsertGraphEdge } from "@shared/schema";

interface LinkedInCSVRow {
  [key: string]: string | undefined;
}

export interface CSVImportResult {
  success: boolean;
  totalRows: number;
  processedPeople: number;
  processedCompanies: number;
  processedConnections: number;
  errors: string[];
}

export class LinkedInCSVService {
  async importCSV(csvText: string, userId: string, organizationId?: string): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: true,
      totalRows: 0,
      processedPeople: 0,
      processedCompanies: 0,
      processedConnections: 0,
      errors: [],
    };

    try {
      const rows = this.parseCSV(csvText);

      // Skip the first row if it contains the Notes header
      const dataRows = rows[0] && rows[0]["First Name"]?.includes("Notes") ? rows.slice(1) : rows;
      result.totalRows = dataRows.length;

      const companyNodes = new Map<string, string>();

      for (const row of dataRows) {
        try {
          // Get first and last name with flexible column name matching
          const firstName = row["First Name"] || "";
          const lastName = row["Last Name"] || "";
          const personName = `${firstName} ${lastName}`.trim();

          if (!personName || personName === "") {
            continue; // Skip empty rows
          }

          const company = row["Company"] || "";
          const position = row["Position"] || "";
          const email = row["Email Address"] || "";
          const linkedinUrl = row["URL"] || "";
          const connectedOn = row["Connected On"] || "";

          const personMetadata = {
            email: email,
            position: position,
            company: company,
            connectedOn: connectedOn,
          };

          const personNode: InsertGraphNode = {
            type: "person",
            name: personName,
            linkedinUrl: linkedinUrl,
            metadata: JSON.stringify(personMetadata),
            userId,
            organizationId,
          };

          const createdPerson = await graphStorage.upsertNode(personNode);
          result.processedPeople++;

          if (company && company.trim() !== "") {
            let companyNodeId = companyNodes.get(company);

            if (!companyNodeId) {
              const companyMetadata = {
                source: "csv",
              };

              const companyNode: InsertGraphNode = {
                type: "company",
                name: company,
                metadata: JSON.stringify(companyMetadata),
                userId,
                organizationId,
              };

              const createdCompany = await graphStorage.upsertNode(companyNode);
              companyNodeId = createdCompany.id;
              companyNodes.set(company, companyNodeId);
              result.processedCompanies++;
            }

            const worksAtEdge: InsertGraphEdge = {
              sourceNodeId: createdPerson.id,
              targetNodeId: companyNodeId,
              relationType: "works_at",
              weight: 50,
              source: "csv",
              metadata: JSON.stringify({ position: position }),
              userId,
              organizationId,
            };

            await graphStorage.upsertEdge(worksAtEdge);
            result.processedConnections++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Row error: ${errorMsg}`);
        }
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`CSV parsing error: ${errorMsg}`);
    }

    return result;
  }

  private parseCSV(csvText: string): LinkedInCSVRow[] {
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must contain headers and at least one row");
    }

    // Skip preamble lines (notes, warnings, etc.) - find the line with actual headers
    let headerLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this line contains the standard LinkedIn header columns
      if (line.includes("First Name") && line.includes("Last Name")) {
        headerLineIndex = i;
        break;
      }
    }

    const headers = this.parseCSVLine(lines[headerLineIndex]);
    const rows: LinkedInCSVRow[] = [];

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = this.parseCSVLine(line);
      const row: LinkedInCSVRow = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          (row as any)[header] = values[index];
        }
      });

      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

export const linkedInCSVService = new LinkedInCSVService();