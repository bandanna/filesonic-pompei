const url = 'https://api-mumbai.lens.dev';

export async function postData(
  query: any,
  variables: any,
  token?: string | null
): Promise<object | null> {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error posting data:', error);
  }

  return null;
}

// no time, so just hardcode lol
export const profiles = new Map<string, string>();

profiles.set(
  '0x3740Ea52f5bBadde4c6aDe7aC324447611a2f1a7'.toLowerCase(),
  '0x8064'
);
