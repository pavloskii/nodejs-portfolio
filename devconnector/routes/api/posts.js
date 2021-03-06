const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Models
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

//Validations
const validatePostInput = require("../../validation/post");

// @route        GET api/posts/test
// @description  Tests post route
// @access       Public
router.get("/test", (req, res) => res.json({ msg: "Posts Works" }));

// @route        POST api/posts
// @description  Create post
// @access       Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route        GET api/posts
// @description  Get all posts
// @access       Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No posts found" }));
});

// @route        GET api/posts/:id
// @description  Get post by id
// @access       Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: "No post found with that id" })
    );
});

// @route        DELETE api/posts/:id
// @description  Delete post
// @access       Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notathorized: "User not authorized" });
          }

          //Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

// @route        POST api/posts/:id/like
// @description  Like a post
// @access       Private
router.post(
  "/:id/like",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    //Check if the user has a profile
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post" });
          }

          //Add user id to likes array
          post.likes.unshift({ user: req.user.id });
          //Save post
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

// @route        POST api/posts/:id/unlike
// @description  Like a post
// @access       Private
router.post(
  "/:id/unlike",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    //Check if the user has a profile (not really needed actually)
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "User has not yet liked this post" });
          }

          //Get remove index
          //   const removeIndex = post.likes
          //     .map(item => item.user.toString())
          //     .indexOf(req.user.id);
          //Can be done like below
          const removeIndex = post.likes.findIndex(
            like => like.user.toString() === req.user.id
          );

          //Splice out of array
          post.likes.splice(removeIndex, 1);

          //Save post
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

// @route        POST api/posts/:id/comment
// @description  Add comment to a post
// @access       Private
router.post(
  "/:id/comment",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body); //Using the same validation as a post

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.user.id
        };

        //Add to comments array
        post.comments.unshift(newComment);

        //Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

// @route        DELETE api/posts/:id/comment/:comment_id
// @description  Delete a comment from a post
// @access       Private
router.delete(
  "/:id/comment/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //Check if the comment exists
        // .some() - returns boolean if there is any object with the condition
        // .find() - returns the first object found with that the condition
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: "Comment does not exist" });
        }

        //Get remove index
        const removeIndex = post.comments.findIndex(
          comment => comment._id.toString() === req.params.comment_id
        );

        //Splice comment out of array
        post.comments.splice(removeIndex, 1);

        //Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

module.exports = router;
