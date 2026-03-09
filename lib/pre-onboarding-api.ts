const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export async function initiateDocumentCollection(request: {
  vacancy_id: string;
  candidate_name: string;
  candidate_lastname: string;
  whatsapp_number: string;
  documents: string[]; // e.g., ["id_card", "driver_license"]
}): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/documents/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Failed to initiate document collection');
  }

  return response.json();
}
