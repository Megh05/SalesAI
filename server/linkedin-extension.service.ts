import { graphStorage } from "./graph.storage";
import type { InsertGraphNode, InsertGraphEdge } from "@shared/schema";

export interface ExtensionPersonData {
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  profileImageUrl?: string;
}

export interface ExtensionCompanyData {
  name: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
}

export interface ExtensionImportData {
  people?: ExtensionPersonData[];
  companies?: ExtensionCompanyData[];
  timestamp: string;
}

export interface ExtensionImportResult {
  success: boolean;
  processedPeople: number;
  processedCompanies: number;
  processedConnections: number;
  errors: string[];
}

export class LinkedInExtensionService {
  async importExtensionData(
    data: ExtensionImportData,
    userId: string,
    organizationId?: string
  ): Promise<ExtensionImportResult> {
    const result: ExtensionImportResult = {
      success: true,
      processedPeople: 0,
      processedCompanies: 0,
      processedConnections: 0,
      errors: [],
    };

    try {
      const companyNodes = new Map<string, string>();

      if (data.companies) {
        for (const companyData of data.companies) {
          try {
            if (!companyData.name) {
              result.errors.push("Skipped company with missing name");
              continue;
            }

            const companyMetadata = {
              industry: companyData.industry,
              size: companyData.size,
              location: companyData.location,
              website: companyData.website,
              source: "extension",
            };

            const companyNode: InsertGraphNode = {
              type: "company",
              name: companyData.name,
              linkedinUrl: companyData.linkedinUrl,
              metadata: JSON.stringify(companyMetadata),
              userId,
              organizationId,
            };

            const createdCompany = await graphStorage.upsertNode(companyNode);
            companyNodes.set(companyData.name, createdCompany.id);
            result.processedCompanies++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            result.errors.push(`Company import error: ${errorMsg}`);
          }
        }
      }

      if (data.people) {
        for (const personData of data.people) {
          try {
            if (!personData.name) {
              result.errors.push("Skipped person with missing name");
              continue;
            }

            const personMetadata = {
              title: personData.title,
              company: personData.company,
              profileImageUrl: personData.profileImageUrl,
              source: "extension",
            };

            const personNode: InsertGraphNode = {
              type: "person",
              name: personData.name,
              linkedinUrl: personData.linkedinUrl,
              metadata: JSON.stringify(personMetadata),
              userId,
              organizationId,
            };

            const createdPerson = await graphStorage.upsertNode(personNode);
            result.processedPeople++;

            if (personData.company) {
              let companyNodeId = companyNodes.get(personData.company);

              if (!companyNodeId) {
                const companyNode: InsertGraphNode = {
                  type: "company",
                  name: personData.company,
                  metadata: JSON.stringify({ source: "extension" }),
                  userId,
                  organizationId,
                };

                const createdCompany = await graphStorage.upsertNode(companyNode);
                companyNodeId = createdCompany.id;
                companyNodes.set(personData.company, companyNodeId);
                result.processedCompanies++;
              }

              const worksAtEdge: InsertGraphEdge = {
                sourceNodeId: createdPerson.id,
                targetNodeId: companyNodeId,
                relationType: "works_at",
                weight: 60,
                source: "extension",
                metadata: JSON.stringify({ title: personData.title }),
                userId,
                organizationId,
              };

              await graphStorage.upsertEdge(worksAtEdge);
              result.processedConnections++;
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            result.errors.push(`Person import error: ${errorMsg}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Extension data import error: ${errorMsg}`);
    }

    return result;
  }
}

export const linkedInExtensionService = new LinkedInExtensionService();
