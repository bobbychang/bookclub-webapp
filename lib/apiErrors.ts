export async function getApiErrorMessage(response: Response, fallback: string) {
  let detail = '';

  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      detail = typeof data?.error === 'string' ? data.error : '';
    } else {
      detail = await response.text();
    }
  } catch {
    detail = '';
  }

  const status = [response.status, response.statusText].filter(Boolean).join(' ');
  return `${fallback}${status ? ` (${status})` : ''}${detail ? `: ${detail}` : ''}.`;
}

export function getUnknownApiErrorMessage(fallback: string) {
  return `${fallback}. Check your connection and try again.`;
}
