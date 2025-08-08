export interface Broker {
  id: string;
  name: string;
}

export interface BrokerResponse {
  brokers: Broker[];
}

export interface SupportedBrokersResponse {
  supported_brokers: string[];
}

export interface UploadBrokerFilesRequest {
  user_id: string;
  broker_id: string;
  files: File[];
}

export type UploadBrokerFilesResponse = {
  user_id: string;
  status: string;
  error_message: string;
  broker: string;
  document_type: string;
  document_name: string;
  filepath: string;
  file_hash: string;
}[]
  
export interface CalculateTaxesRequest {
  user_id: string;
  nif?: string;
  p_l_analysis_year?: number;
  p_l_calculation_type: "pl_average_weighted" | "pl_detailed";
}

export interface CalculateTaxesResponse {
  // Add response fields based on what the API returns
  [key: string]: unknown;
}

