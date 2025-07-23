import { CameraDebugInfo } from '@/components/debug/camera-debug';

export default function CameraDebugPage() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-8">Camera Debug Page</h1>
            <CameraDebugInfo />
        </div>
    );
}
