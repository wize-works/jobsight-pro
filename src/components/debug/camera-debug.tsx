"use client";

import React, { useState, useEffect } from 'react';

export function CameraDebugInfo() {
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [testResults, setTestResults] = useState<any>({});

    useEffect(() => {
        const collectDebugInfo = async () => {
            const info: any = {
                userAgent: navigator.userAgent,
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                isSecure: window.location.protocol === 'https:' ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1',
                mediaDevicesSupported: !!navigator.mediaDevices,
                getUserMediaSupported: !!(navigator.mediaDevices?.getUserMedia),
                enumerateDevicesSupported: !!(navigator.mediaDevices?.enumerateDevices),
                permissionsSupported: 'permissions' in navigator,
                timestamp: new Date().toISOString()
            };

            // Test device enumeration
            if (navigator.mediaDevices?.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    info.devices = {
                        total: devices.length,
                        videoInputs: devices.filter(d => d.kind === 'videoinput').length,
                        audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                        audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
                        deviceList: devices.map(d => ({
                            kind: d.kind,
                            label: d.label || 'No label (permission not granted)',
                            deviceId: d.deviceId ? 'Present' : 'Missing'
                        }))
                    };
                } catch (error) {
                    info.devicesError = error instanceof Error ? error.message : String(error);
                }
            }

            // Test permissions API
            if ('permissions' in navigator) {
                try {
                    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    info.cameraPermission = {
                        state: cameraPermission.state,
                        supported: true
                    };
                } catch (error) {
                    info.cameraPermission = {
                        supported: false,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            }

            setDebugInfo(info);
        };

        collectDebugInfo();
    }, []);

    const testCameraAccess = async () => {
        setTestResults({ testing: true });

        try {
            console.log('Testing camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

            const tracks = stream.getVideoTracks();
            const track = tracks[0];

            const result = {
                success: true,
                streamId: stream.id,
                trackCount: tracks.length,
                trackLabel: track?.label || 'No label',
                trackSettings: track?.getSettings(),
                trackCapabilities: track?.getCapabilities?.(),
                timestamp: new Date().toISOString()
            };

            // Stop the stream
            stream.getTracks().forEach(track => track.stop());

            setTestResults(result);
            console.log('Camera test successful:', result);
        } catch (error) {
            const result = {
                success: false,
                error: {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : 'No stack'
                },
                timestamp: new Date().toISOString()
            };

            setTestResults(result);
            console.error('Camera test failed:', result);
        }
    };

    return (
        <div className="p-4 bg-base-100 border rounded-lg">
            <h3 className="text-lg font-bold mb-4">Camera Debug Information</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">System Information</h4>
                    <pre className="text-xs bg-base-200 p-2 rounded overflow-x-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>

                <div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={testCameraAccess}
                        disabled={testResults.testing}
                    >
                        {testResults.testing ? 'Testing...' : 'Test Camera Access'}
                    </button>
                </div>

                {Object.keys(testResults).length > 0 && !testResults.testing && (
                    <div>
                        <h4 className="font-semibold mb-2">Test Results</h4>
                        <pre className="text-xs bg-base-200 p-2 rounded overflow-x-auto">
                            {JSON.stringify(testResults, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
