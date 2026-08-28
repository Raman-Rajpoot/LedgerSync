import express from 'express'
import { getClient, postClient, getAllClients, deleteClient, updateClient } from '../controllers/client.controller.js';

const router = express.Router();

router.get("/getAllClient", getAllClients);
router.get("/getClient/:id", getClient);
router.post("/createClient", postClient);
router.delete("/deleteClient/:id", deleteClient);
router.patch("/updateClient/:id", updateClient);

// RESTful route compatibility
router.get('/:id', getClient);
router.delete('/:id', deleteClient);
router.put('/:id', updateClient);

export default router
