const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');


router.get('/new', protect, (req, res) => {
  res.render('posts/new', { title: 'New Post' });
});



router.post('/', protect, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = new Post({
      title,
      content,
      author: req.user._id
    });

    await post.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error('❌ Error creating post:', err.message);
    res.status(400).render('posts/new', {
      title: 'New Post',
      error: 'Error creating post',
      post: req.body
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username');
    res.render('posts/index', { title: 'All Posts', posts });
  } catch (err) {
    console.error('❌ Error fetching posts:', err.message);
    res.status(500).send('Server error');
  }
});


router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');

    if (!post) {
      return res.status(404).render('error', {
        title: 'Post Not Found',
        error: 'The requested post was not found.'
      });
    }

    res.render('posts/show', { title: post.title, post });
  } catch (err) {
    console.error('❌ Error fetching post:', err.message);
    res.status(400).render('error', {
      title: 'Invalid Post ID',
      error: 'Invalid post identifier provided.'
    });
  }
});


router.get('/:id/edit', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.redirect('/posts');

    if (!post.isAuthor(req.user._id)) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        error: 'You are not authorized to edit this post.'
      });
    }

    res.render('posts/edit', { title: 'Edit Post', post });
  } catch (err) {
    console.error('❌ Error loading edit form:', err.message);
    res.redirect('/posts');
  }
});


router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isAuthor(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.title = title;
    post.content = content;
    post.updatedAt = Date.now();

    await post.save();

    res.status(200).json({
      message: 'Post updated successfully',
      post
    });
  } catch (err) {
    console.error('❌ Error updating post:', err.message);
    res.status(500).json({ message: 'Error updating post' });
  }
});


// DELETE: Delete Post
// DELETE: Delete Post
// DELETE Post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isAuthor(req.user._id)) {
      return res.sendStatus(204); // Silent fail
    }
    await Post.deleteOne({ _id: req.params.id });
    res.sendStatus(200); // Silent success
  } catch (err) {
    console.error('Delete error:', err);
    res.sendStatus(204); // Silent fail
  }
});

// GET Edit Profile Form
router.get('/edit', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('users/edit', { 
      title: 'Edit Profile',
      user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

// POST Update Profile
router.post('/update', protect, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true, runValidators: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});
module.exports = router;
