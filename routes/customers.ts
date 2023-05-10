import express from "express";
import { Customer, validateCustomer } from "../models/customer";
export const customersRouter = express.Router();

customersRouter.get("/", async (req, res) => {
  const customers = await Customer.find().sort('name');
  res.send(customers);
});

customersRouter.get("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).send("Customer was not found");
  res.send(customer);
});

customersRouter.post("/", async(req, res) => {
    let customerInfo = {
        name: '',
        phone: '',
        isGold: false,
    };
  try {
      const { name, phone, isGold } = validateCustomer(req.body);
      customerInfo = {
          name,
          phone,
          isGold
      }
  } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
  }
  const newCustomer = new Customer(customerInfo);
  const customer = await newCustomer.save();
  res.send(customer);
});

