"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

const expect = chai.expect;

const { BlogPost } = require("../models");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

function seedBlogData() {
  console.info("seeding blog data");
  const seedData = [];
  for (let i = 0; i < 10; i++) {
    seedData.push(generateBlogData());
  }
  return BlogPost.insertMany(seedData);
}

function generateBlogData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.word(),
    content: faker.lorem.text()
  };
}

function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
}

describe("Blog API resource", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe("GET endpoint", function() {
    it("should return all existing blog posts", function() {
      let res;
      return chai
        .request(app)
        .get("/posts")
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body).to.have.length(count);
        });
    });

    it("should return post with right fields", function() {
      let resBlog;
      return chai
        .request(app)
        .get("/posts")
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a("array");
          expect(res.body).to.have.length.of.at.least(1);

          res.body.forEach(function(post) {
            expect(post).to.be.a("object");
            expect(post).to.include.keys("id", "title", "author", "content");
          });
          resBlog = res.body[0];
          return BlogPost.findById(resBlog.id);
        })
        .then(function(post) {
          expect(resBlog.id).to.equal(post.id);
          expect(resBlog.title).to.equal(post.title);
          expect(resBlog.content).to.equal(post.content);
        });
    });
  });

  describe("POST endpoint", function() {
    it("should add a new blog post", function() {
      const newBlogPost = generateBlogData();

      return chai
        .request(app)
        .post("/posts")
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys("id", "title", "content", "author");
          expect(res.body.title).to.equal(newBlogPost.title);
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newBlogPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(newBlogPost.title);
          expect(post.content).to.equal(newBlogPost.content);
        });
    });
  });

  describe("PUT endpoint", function() {
    it("should update fields sent", function() {
      const updateData = {
        title: "Everything is Broken",
        author: {
          firstName: "Depths O.",
          lastName: "Despair"
        }
      };

      return BlogPost.findOne()
        .then(function(post) {
          updateData.id = post.id;

          return chai
            .request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(updateData.title);
          expect(post.author.firstName).to.equal(updateData.author.firstName);
          expect(post.author.lastName).to.equal(updateData.author.lastName);
        });
    });
  });

  describe("DELETE endpoint", function() {
    it("should delete a blog post by id", function() {
      let post;

      return BlogPost.findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });
});
