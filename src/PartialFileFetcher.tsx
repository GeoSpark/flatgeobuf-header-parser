import React, { useEffect, useState } from 'react';

import { ByteBuffer } from 'flatbuffers';

import {FlatGeobuf} from "./fgb-header";

type Props = {
    url: string;
};

export const PartialFileFetcher: React.FC<Props> = ({ url }) => {
    const [parsedData, setParsedData] = useState<object>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHeader = async () => {
            try {
                // Step 1: Fetch first 12 bytes
                const initialRes = await fetch(url, {
                    headers: {
                        Range: `bytes=0-11`,
                    },
                });

                if (!initialRes.ok && initialRes.status !== 206) {
                    throw new Error(`Initial fetch failed: ${initialRes.status}`);
                }

                const initialBuffer = await initialRes.arrayBuffer();
                if (initialBuffer.byteLength < 12) {
                    throw new Error('Initial header too short');
                }

                if (!isFlatGeobuf(initialBuffer)) {
                    throw new Error('Not a FlatGeobuf file');
                }

                // Step 2: Read last 4 bytes as a 32-bit unsigned int (e.g., little-endian)
                const view = new DataView(initialBuffer);
                const headerSize = view.getUint32(8, true); // byteOffset = 8, littleEndian = true

                // Step 3: Fetch the rest of the header
                const restRes = await fetch(url, {
                    headers: {
                        Range: `bytes=12-${12 + headerSize - 1}`,
                    },
                });

                if (!restRes.ok && restRes.status !== 206) {
                    throw new Error(`Rest header fetch failed: ${restRes.status}`);
                }

                const restBuffer = await restRes.arrayBuffer();

                // Step 4: Parse the full header
                const result = parseHeader(restBuffer);
                setParsedData(result);
            } catch (err) {
                setError((err as Error).message);
            }
        };

        fetchHeader().then();
    }, [url]);

    return (
        <div>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <pre>{parsedData ? JSON.stringify(parsedData, null, 2) : 'Loading...'}</pre>
        </div>
    );
};


function isFlatGeobuf(buffer: ArrayBuffer): boolean {
    // The FlatGeobuf magic number: "FlatGeobuf"
    const expectedMagic = [
        0x66,
        0x67,
        0x62,
        0x03,
        0x66,
        0x67,
        0x62,
        0x01,
    ];

    const bytes = new Uint8Array(buffer, 0, expectedMagic.length);
    for (let i = 0; i < expectedMagic.length; i++) {
        if (bytes[i] !== expectedMagic[i]) {
            return false;
        }
    }
    return true;
}

function parseCsvString(input: string): string[] {
    // Matches 'quoted, strings', trims, and unescapes single quotes if needed
    const regex = /'([^']*)'/g;
    const results: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
        results.push(match[1]);
    }

    return results;
}

function parseHeader(buffer: ArrayBuffer): object {
    const buf = new ByteBuffer(new Uint8Array(buffer));
    const header = FlatGeobuf.Header.getRootAsHeader(buf);
    const o = JSON.parse(header.metadata() || "");
    o["rendered_columns"] = parseCsvString(o["rendered_columns"]);
    return o;
}
