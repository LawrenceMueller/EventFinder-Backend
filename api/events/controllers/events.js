"use strict";
const { default: createStrapi } = require("strapi");
const { sanitizeEntity, parseMultipartData } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 *
 * This file is a custom endpoint I made to get all the events associated with a user
 */

module.exports = {
  // Create an event that is associated to a user
  // First create an entity and check if it is multipart
  // Based on that check, set the entity to equal the data from context with the needed user id
  // Return the created entity that has both the data from the event and the user id for association
  async create(ctx) {
    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data.user = ctx.state.user.id;
      entity = await strapi.services.events.create(data, { files });
    } else {
      ctx.request.body.user = ctx.state.user.id;
      entity = await strapi.services.events.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.events });
  },

  // Update user event
  // First get the id of the user in question
  // Find the event based on the user id
  // If the event can not be found then return "You can't update this entry"
  // Query if context is multipart and parse from there.
  // Return entity that has been set to the updated strapi object
  async update(ctx) {
    const { id } = ctx.params;

    let entity;

    const [events] = await strapi.services.events.find({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!events) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.events.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.events.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.events });
  },

  // Delete a user event
  // First find the id of the user the event is attatched to
  // Next Find the specific event, if no event is found say "you can't update this entry"
  // Call strapi to delete event based on id
  // return new entity that reflects deleted event
  async delete(ctx) {
    const { id } = ctx.params;

    const [events] = await strapi.services.events.find({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!events) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    const entity = await strapi.services.events.delete({ id });
    return sanitizeEntity(entity, { model: strapi.models.events });
  },

  // Get Logged in Users
  // First I create a user which uses the context to tell whether or not this is a real authenticated user
  // Next I create a data object and set it to all of the events strapi finds for the current user
  // Finally I return all the events for the user, if I found any.
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services.events.find({ user: user.id });

    if (!data) {
      return ctx.notFound();
    }

    return sanitizeEntity(data, { model: strapi.models.events });
  },
};
