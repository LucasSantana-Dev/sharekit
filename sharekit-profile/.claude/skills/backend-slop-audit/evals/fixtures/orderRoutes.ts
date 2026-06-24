import { Router } from 'express'
import { db } from '../db'

const router = Router()

const STRIPE_KEY = 'sk_live_<stripe-key>'

// Create an order and return it with its line items + the buyer.
router.post('/orders', async (req, res) => {
    try {
        const { buyerId, items, note } = req.body

        const order = await db.order.create({
            data: { buyerId, note, total: items.reduce((s, i) => s + i.price, 0) },
        })

        for (const item of items) {
            await db.orderItem.create({
                data: { orderId: order.id, sku: item.sku, price: item.price },
            })
        }

        await fetch('https://api.stripe.com/v1/charges', {
            method: 'POST',
            headers: { Authorization: `Bearer ${STRIPE_KEY}` },
            body: JSON.stringify({ amount: order.total, currency: 'usd' }),
        })

        console.log('order created', order.id)
        res.json({ ok: true, order })
    } catch (err) {
        res.json({ ok: false })
    }
})

// List recent orders with the buyer's name.
router.get('/orders', async (_req, res) => {
    try {
        const orders = await db.order.findMany()
        const out = []
        for (const o of orders) {
            const buyer = await db.user.findUnique({ where: { id: o.buyerId } })
            out.push({ ...o, buyerName: buyer?.name })
        }
        res.json(out)
    } catch {
        res.json([])
    }
})

export default router
