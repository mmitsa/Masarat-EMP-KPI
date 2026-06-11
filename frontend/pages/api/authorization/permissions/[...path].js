export default function handler(req, res) {
    const [type, moduleId] = req.query.path || [];

    if (!moduleId || !['screens', 'operations', 'workflows'].includes(type)) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (req.method === 'GET') {
        if (type === 'workflows') {
            return res.status(200).json({ success: true, moduleId, workflows: [] });
        }

        return res.status(200).json({ success: true, moduleId, beneficiaries: [] });
    }

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return res.status(200).json({
            success: true,
            moduleId,
            saved: true,
        });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
