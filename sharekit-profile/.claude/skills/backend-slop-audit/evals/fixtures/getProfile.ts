import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { logger } from '../logger'

const router = Router()

const ParamsSchema = z.object({ id: z.string().uuid() })

// Fetch a user's public profile by id.
router.get('/users/:id/profile', async (req, res) => {
    const parsed = ParamsSchema.safeParse(req.params)
    if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_user_id' })
    }

    try {
        const user = await db.user.findUnique({
            where: { id: parsed.data.id },
            select: { id: true, name: true, avatarUrl: true, bio: true },
        })

        if (!user) {
            return res.status(404).json({ error: 'not_found' })
        }

        return res.status(200).json(user)
    } catch (err) {
        logger.error('failed to load profile', {
            userId: parsed.data.id,
            err,
        })
        return res.status(500).json({ error: 'internal_error' })
    }
})

export default router
