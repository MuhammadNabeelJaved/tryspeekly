import Joi from 'joi';

export const blogValidation = {
  create: {
    body: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      content: Joi.string().required(),
      excerpt: Joi.string().max(500).optional(),
      slug: Joi.string().optional(),
      coverImage: Joi.string().uri().optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      status: Joi.string().valid('draft', 'published', 'archived').default('draft')
    })
  },

  update: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200),
      content: Joi.string(),
      excerpt: Joi.string().max(500).allow('', null),
      slug: Joi.string(),
      coverImage: Joi.string().uri().allow('', null),
      tags: Joi.array().items(Joi.string()),
      status: Joi.string().valid('draft', 'published', 'archived')
    }).min(1)
  },

  getById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  getBySlug: {
    params: Joi.object({
      slug: Joi.string().required()
    })
  },

  list: {
    query: Joi.object({
      status: Joi.string().valid('draft', 'published', 'archived'),
      tag: Joi.string(),
      author: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      search: Joi.string(),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10)
    })
  },

  delete: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  }
};
