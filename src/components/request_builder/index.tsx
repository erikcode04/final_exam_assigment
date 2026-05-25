import React from 'react';
import { useRequest, HttpMethod, KeyValueRow } from '../../hooks/useRequest';
import { Project } from '../../hooks/useProjects';
import styles from './RequestBuilder.module.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#a78bfa',
    DELETE: '#ef4444',
};

interface Props {
    project: Project;
}

function KeyValueEditor({
    rows,
    onChange,
}: {
    rows: KeyValueRow[];
    onChange: (rows: KeyValueRow[]) => void;
}) {
    const update = (i: number, field: keyof KeyValueRow, value: string | boolean) => {
        const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
        // auto-add empty row at end if last row has content
        if (i === rows.length - 1 && value !== '' && field !== 'enabled') {
            next.push({ key: '', value: '', enabled: true });
        }
        onChange(next);
    };

    const remove = (i: number) => {
        if (rows.length === 1) return;
        onChange(rows.filter((_, idx) => idx !== i));
    };

    return (
        <div className={styles.kvTable}>
            {rows.map((row, i) => (
                <div key={i} className={styles.kvRow}>
                    <input
                        type="checkbox"
                        className={styles.kvCheck}
                        checked={row.enabled}
                        onChange={(e) => update(i, 'enabled', e.target.checked)}
                    />
                    <input
                        className={styles.kvInput}
                        placeholder="Key"
                        value={row.key}
                        onChange={(e) => update(i, 'key', e.target.value)}
                    />
                    <input
                        className={styles.kvInput}
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => update(i, 'value', e.target.value)}
                    />
                    <button className={styles.kvRemove} onClick={() => remove(i)}>×</button>
                </div>
            ))}
        </div>
    );
}

function statusColor(code: number) {
    if (code < 300) return '#22c55e';
    if (code < 400) return '#f59e0b';
    return '#ef4444';
}

const RequestBuilder: React.FC<Props> = ({ project }) => {
    const {
        method, setMethod,
        url, setUrl,
        params, setParams,
        headers, setHeaders,
        body, setBody,
        activeTab, setActiveTab,
        response,
        sending,
        requestError,
        sendRequest,
    } = useRequest();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') sendRequest();
    };

    const prettyBody = (() => {
        if (response?.data === undefined) return '';
        try {
            return JSON.stringify(response.data, null, 2);
        } catch {
            return String(response.data);
        }
    })();

    return (
        <div className={styles.container}>
            {/* Project name header */}
            <div className={styles.projectHeader}>
                <span className={styles.projectName}>{project.name}</span>
            </div>

            {/* URL bar */}
            <div className={styles.urlBar}>
                <select
                    className={styles.methodSelect}
                    value={method}
                    onChange={(e) => setMethod(e.target.value as HttpMethod)}
                    style={{ color: METHOD_COLORS[method] }}
                >
                    {METHODS.map((m) => (
                        <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
                            {m}
                        </option>
                    ))}
                </select>
                <input
                    className={styles.urlInput}
                    placeholder="https://api.example.com/endpoint"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className={styles.sendBtn}
                    onClick={sendRequest}
                    disabled={sending || !url.trim()}
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </div>

            {/* Request tabs */}
            <div className={styles.tabs}>
                {(['params', 'headers', 'body'] as const).map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'params' && (
                    <KeyValueEditor rows={params} onChange={setParams} />
                )}
                {activeTab === 'headers' && (
                    <KeyValueEditor rows={headers} onChange={setHeaders} />
                )}
                {activeTab === 'body' && (
                    <textarea
                        className={styles.bodyEditor}
                        placeholder={'{\n  "key": "value"\n}'}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        spellCheck={false}
                    />
                )}
            </div>

            {/* Response */}
            <div className={styles.responseDivider} />
            <div className={styles.responseSection}>
                {!response && !requestError && !sending && (
                    <p className={styles.responsePlaceholder}>Hit Send to see the response</p>
                )}
                {sending && <p className={styles.responsePlaceholder}>Sending…</p>}
                {requestError && <p className={styles.responseError}>{requestError}</p>}
                {response && (
                    <>
                        <div className={styles.responseBar}>
                            <span className={styles.statusBadge} style={{ color: statusColor(response.status) }}>
                                {response.status} {response.statusText}
                            </span>
                            <span className={styles.responseMeta}>{response.duration} ms</span>
                        </div>
                        <pre className={styles.responseBody}>{prettyBody}</pre>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestBuilder;
