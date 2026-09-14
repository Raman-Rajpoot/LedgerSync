import { prisma } from '../db/db.js';

const getOrganizationId = (req) => req.user?.organizationId ?? req.query?.organizationId ?? req.query?.organisationId ?? req.body?.organizationId ?? req.body?.organisationId;

// GET all clients for the organization
export const getAllClients = async (req, res) => {
    try {
        const organizationId = getOrganizationId(req);
        console.log("req....")
        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const clients = await prisma.client.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(clients);
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// GET a specific client
export const getClient = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = getOrganizationId(req);
        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const client = await prisma.client.findFirst({
            where: { id, organizationId }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });

        res.status(200).json(client);
    } catch (error) {
        console.error('Failed to fetch client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

// POST a new client
export const postClient = async (req, res) => {
    try {
        const organizationId = getOrganizationId(req);
        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const { email = '', name, phone, customNotes = '', companyName = '', project = '' } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const newClient = await prisma.client.create({
            data: {
                email: String(email ?? ''),
                name: String(name).trim(),
                phone: phone ? String(phone) : '',
                customNotes: String(customNotes ?? ''),
                companyName: String(companyName ?? ''),
                project: project ? String(project) : '',
                organizationId,
            }
        });

        res.status(201).json({ message: 'Client created', client: newClient });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client', errorDetails: error.message });
    }
};

// DELETE a client
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = getOrganizationId(req);
        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const client = await prisma.client.findFirst({
            where: { id, organizationId }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });

        await prisma.client.delete({
            where: { id }
        });

        res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Failed to delete client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};

// PATCH/PUT update a client
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = getOrganizationId(req);
        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const existing = await prisma.client.findFirst({ where: { id, organizationId } });
        if (!existing) return res.status(404).json({ error: 'Client not found' });

        const { name, email, phone, customNotes, companyName, project } = req.body;

        const updated = await prisma.client.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: String(name).trim() }),
                ...(email !== undefined && { email: String(email ?? '') }),
                ...(phone !== undefined && { phone: phone ? String(phone) : '' }),
                ...(customNotes !== undefined && { customNotes: String(customNotes ?? '') }),
                ...(companyName !== undefined && { companyName: String(companyName ?? '') }),
                ...(project !== undefined && { project: project ? String(project) : '' }),
            }
        });

        res.status(200).json({ message: 'Client updated', client: updated });
    } catch (err) {
        console.error('Failed to update client:', err);
        res.status(500).json({ error: 'Failed to update client' });
    }
};

export default {
    getAllClients,
    getClient,
    postClient,
    deleteClient,
    updateClient,
};