import Client from "../models/client.js";

async function getClients(req, res, next) {
    try {
        const { page, limit } = req.query;

        if (!page || !limit) {
            const clients = await Client.find()
                .sort({ totalPurchaseCount: -1 }); // Los mejores clientes primero

            return res.status(200).json({
                clients
            });
        }

        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 10;
        const skip = (pageInt - 1) * limitInt;

        const clients = await Client.find()
            .sort({ totalPurchaseCount: -1 })
            .skip(skip)
            .limit(limitInt);

        const totalResults = await Client.countDocuments();
        const totalPages = Math.ceil(totalResults / limitInt);

        res.status(200).json({
            clients,
            pagination: {
                currentPage: pageInt,
                totalPages,
                totalResults,
                hasNext: pageInt < totalPages,
                hasPrev: pageInt > 1
            }
        });

    } catch (error) {
        next(error);
    }
};

async function createClient(req, res, next) {
    try {
        const { displayName, email } = req.body;

        if (!displayName || !email) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const newClient = new Client({
            displayName,
            email
        });

        await newClient.save();

        const created = await Client.findById(newClient._id);

        res.status(201).json({ message: 'Client created successfully', client: created });

    } catch (error) {
        next(error);
    }
}

async function updateClient(req, res, next) {
    try {
        const { clientId } = req.params;
        const { displayName, email } = req.body;

        if (!displayName && !email) {
            return res.status(400).json({
                message: 'At least one field must be provided to update'
            });
        }

        const client = await Client.findById(clientId);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (displayName) client.displayName = displayName;
        if (email) client.email = email;

        await client.save();

        const updatedClient = await Client.findById(clientId);

        res.status(200).json({
            message: 'Client updated successfully',
            client: updatedClient
        });

    } catch (error) {
        next(error);
    }
};

async function checkEmail(req, res, next) {
    try {
        const email = String(req.query.email || "")
            .trim()
            .toLowerCase();

        const client = await Client.findOne({ email });
        res.json({ taken: !!client });
    } catch (err) {
        next(err);
    }
};

async function searchClient(req, res, next) {
    try {
        const { search } = req.query;

        if (!search) {
            return res.status(400).json({ message: 'El término de búsqueda es requerido' });
        }

        const cleanSearch = String(search).trim();

        const clients = await Client.find({
            $or: [
                { displayName: { $regex: cleanSearch, $options: 'i' } },
                { email: { $regex: cleanSearch, $options: 'i' } },
            ]
        }).limit(5);

        res.status(200).json({ clients });
    } catch (error) {
        next(error);
    }
}

export {
    getClients,
    createClient,
    updateClient,
    checkEmail,
    searchClient
};