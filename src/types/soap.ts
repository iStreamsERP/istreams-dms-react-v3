export interface SoapParameter {
  [key: string]: string | number | boolean;
}

export interface AxiosResponse<T = unknown> {
  data: T;
}

export interface SoapResponse {
  'soap:Envelope': {
    'soap:Body': {
      [key: string]: unknown;
    };
  };
}