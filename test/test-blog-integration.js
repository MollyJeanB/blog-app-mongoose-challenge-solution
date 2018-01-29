// "use strict";
//
// const chai = require("chai");
// const chaiHttp = require("chai-http");
// const faker = require("faker");
// const mongoose = require("mongoose");
//
// const expect = chai.expect;
//
// const { BlogPost } = require("../models");
// const { app, runServer, closeServer } = require("../server");
// const { TEST_DATABASE_URL } = require("../config");
//
// chai.use(chaiHttp);
//
// function seedBlogData() {
//   console.info("seeding blog data");
//   const seedData = [];
//
//   for (let i = 0; i < seedData.length; i++) {
//     seedData.push(generateBlogData());
//   }
//   return BlogPost.insertMany(seedData);
// }
//
// function generateBlogData() {
//   return {
//     author: {
//       firstName: faker.name.firstName(),
//       lastName: faker.name.lastName()
//     },
//     title: faker.lorem.word(),
//     content: faker.lorem.text()
//   };
// }
//
// function tearDownDb() {
//   console.warn("Deleting database");
//   return mongoose.connection.dropDatabase();
// }
//
// describe("Blog API resource", function() {
//   before(function() {
//     return runServer(TEST_DATABASE_URL);
//   });
//
//   beforeEach(function() {
//     return seedBlogData();
//   });
//
//   afterEach(function() {
//     return tearDownDb();
//   });
//
//   after(function() {
//     return closeServer();
//   });
//
//   describe("GET endpoint", function() {
//     it("should return all existing blog posts", function() {
//       let res;
//       return chai
//         .request(app)
//         .get("/posts")
//         .then(function(_res) {
//           res = _res;
//           expect(res).to.have.status(200);
//           expect(res.body.posts).to.have.length.of.at.least(1);
//           return BlogPost.count();
//         })
//         .then(function(count) {
//           expect(res.body.posts).to.have.length.of(count);
//         });
//     });
//
//     it("should return post with right fields", function() {
//       let resBlog;
//       return chai
//         .request(app)
//         .get("/posts")
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body.posts).to.be.a("array");
//           expect(res.body.posts).to.have.length.of.at.least(1);
//
//           res.body.posts.forEach(function(post) {
//             expect(post).to.be.a("object");
//             expect(post).to.include.keys("id", "title", "author", "content");
//           });
//           resBlog = res.body.posts[0];
//           return BlogPost.findById(resBlog.id);
//         })
//         .then(function(post) {
//           expect(resBlog.id).to.equal(post.id);
//           expect(resBlog.title).to.equal(post.title);
//           expect(resBlog.content).to.equal(post.content);
//         });
//     });
//   });
//
//   describe("POST endpoint", function() {
//     it("should add a new blog post", function() {
//       const newBlogPost = generateBlogData();
//
//       return chai
//         .request(app)
//         .post("/posts")
//         .send(newBlogPost)
//         .then(function(res) {
//           expect(res).to.have.status(201);
//           expect(res).to.be.json;
//           expect(res.body).to.be.a("object");
//           expect(res.body).to.include.keys("id", "title", "content", "author");
//           expect(res.body.title).to.equal(newBlogPost.title);
//           expect(res.body.id).to.not.be.null;
//           expect(res.body.content).to.equal(newBlogPost.content);
//         })
//         .then(function(post) {
//           expect(post.title).to.equal(newBlogPost.title);
//           expect(post.content).to.equal(newBlogPost.content);
//         });
//     });
//   });
//
//   describe("PUT endpoint", function() {
//     it("should update fields sent", function() {
//       const updateData = {
//         title: "Everything is Broken",
//         author: {
//           firstName: "Depths O.",
//           lastName: "Despair"
//         }
//       };
//
//       return BlogPost.findOne()
//         .then(function(post) {
//           updateData.id = post.id;
//
//           return chai
//             .request(app)
//             .put(`/posts/${post.id}`)
//             .send(updateData);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(204);
//
//           return BlogPost.findById(updateData.id);
//         })
//         .then(function(post) {
//           expect(post.title).to.equal(updateData.title);
//           expect(post.author.firstName).to.equal(updateData.author.firstName);
//           expect(post.author.lastName).to.equal(updateData.author.lastName);
//         });
//     });
//   });
//
//   describe("DELETE endpoint", function() {
//     it("should delete a blog post by id", function() {
//       let post;
//
//       return BlogPost.findOne()
//         .then(function(_post) {
//           post = _post;
//           return chai.request(app).delete(`/posts/${post.id}`);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(204);
//           return BlogPost.findById(post.id);
//         })
//         .then(function(_post) {
//           expect(_post).to.be.null;
//         });
//     });
//   });
// });

"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// this makes the should syntax available throughout
// this module
const should = chai.should();

const { BlogPost } = require("../models");
const { closeServer, runServer, app } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn("Deleting database");
    mongoose.connection
      .dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedBlogPostData() {
  console.info("seeding blog post data");
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

describe("blog posts API resource", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    // tear down database so we ensure no state from this test
    // effects any coming after.
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe("GET endpoint", function() {
    it("should return all existing posts", function() {
      // strategy:
      //    1. get back all posts returned by by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of posts we got back is equal to number
      //       in db.
      let res;
      return chai
        .request(app)
        .get("/posts")
        .then(_res => {
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);

          return BlogPost.count();
        })
        .then(count => {
          // the number of returned posts should be same
          // as number of posts in DB
          res.body.should.have.length.of(count);
        });
    });

    it("should return posts with right fields", function() {
      // Strategy: Get back all posts, and ensure they have expected keys

      let resPost;
      return chai
        .request(app)
        .get("/posts")
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a("array");
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(post) {
            post.should.be.a("object");
            post.should.include.keys(
              "id",
              "title",
              "content",
              "author",
              "created"
            );
          });
          // just check one of the posts that its values match with those in db
          // and we'll assume it's true for rest
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);
        });
    });
  });

  describe("POST endpoint", function() {
    // strategy: make a POST request with data,
    // then prove that the post we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it("should add a new blog post", function() {
      const newPost = {
        title: faker.lorem.sentence(),
        author: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName()
        },
        content: faker.lorem.text()
      };

      return chai
        .request(app)
        .post("/posts")
        .send(newPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a("object");
          res.body.should.include.keys(
            "id",
            "title",
            "content",
            "author",
            "created"
          );
          res.body.title.should.equal(newPost.title);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;
          res.body.author.should.equal(
            `${newPost.author.firstName} ${newPost.author.lastName}`
          );
          res.body.content.should.equal(newPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });

  describe("PUT endpoint", function() {
    // strategy:
    //  1. Get an existing post from db
    //  2. Make a PUT request to update that post
    //  4. Prove post in db is correctly updated
    it("should update fields you send over", function() {
      const updateData = {
        title: "cats cats cats",
        content: "dogs dogs dogs",
        author: {
          firstName: "foo",
          lastName: "bar"
        }
      };

      return BlogPost.findOne()
        .then(post => {
          updateData.id = post.id;

          return chai
            .request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(post => {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
        });
    });
  });

  describe("DELETE endpoint", function() {
    // strategy:
    //  1. get a post
    //  2. make a DELETE request for that post's id
    //  3. assert that response has right status code
    //  4. prove that post with the id doesn't exist in db anymore
    it("should delete a post by id", function() {
      let post;

      return BlogPost.findOne()
        .then(_post => {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(res => {
          res.should.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(_post => {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_post.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(_post);
        });
    });
  });
});
