const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require("fs");
const { type } = require('os');

//image upload
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./uploads");
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "_" +Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage : storage,
}).single("image");


// insert an user  into database route
// router.post('/add', upload, (req, res) => {
//     const user = new User({
//         name: req.body.name,
//         email: req.body.email,
//         phone: req.body.phone,
//         image: req.file.filename,
//     });
//     user.save((err) => {
//         if(err){
//             res.json({message: err.message, type: 'danger'});
//         } else {
//             req.session.message = {
//                 type: 'success',
//                 message: 'User added successfully!'
//             };
//             res.redirect("/");
//         }
//     })
// })



// insert an user into database route
router.post('/add', upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    user.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User added successfully!'
            };
            res.redirect("/");
        })
        .catch(err => {
            res.json({message: err.message, type: 'danger'});
        });
});

// Get all users route
// router.get('/', (req,res) => {
//     // res.render("index.ejs",{ title: "Home Page" });
//     User.find().exec((err, users) => {
//         if(err){
//             res.json({message: err.message});
//         }else {
//             res.render('index.ejs', {
//                 title: 'Home Page',
//                 users: users,
//             });
//         }
//     })
// });


// Get all users route
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index.ejs', {
            title: 'Home Page',
            users: users,
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.json({ message: 'Failed to retrieve users', error: err.message });
    }
});


router.get('/add', (req,res) => {
    res.render('add_users.ejs', { title: "Add Users"});
});


//Edit an user route
// router.get('/edit/:id', (req, res) => {
//     let id = req.params.id;
//     User.findById(id, (err, user) => {
//         if (err){
//             res.redirect('/');
//         } else{
//             if(user == null){
//                 res.redirect('/');
//             } else {
//                 res.render("edit_users", {
//                     title: "Edit User",
//                     user: user,
//                 });
//             }
//         }
//     })
// });



// //Edit an user route
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        
        if (!user) {
            return res.redirect('/');
        }
        
        res.render("edit_users.ejs", {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});


// Update user route
// router.post('/update/:id', upload, (req, res) => {
//     let id = req.params.id;
//     let new_image = '';

//     if(req.file){
//         new_image = req.file.filename;
//         try{
//             fs.unlinkSync('./uploads/'+req.body.old_image);
//         } catch(err) {
//             console.log(err);
//         }
//     } else {
//         new_image = req.body.old_image;
//     }

//     User.findByIdAndUpdate(id, {
//         name: req.body.name,
//         email: req.body.email,
//         phone: req.body.phone,
//         image: req.body.new_image,
//     }, (err, result) => {
//         if(err){
//             res.json({message: err.message, type: 'danger'});
//         } else {
//             req.session.message = {
//                 type: 'success',
//                 message: 'User updated successfully!',
//             };
//             res.redirect("/");
//         }
//     })
// });



//Update user router
router.post('/update/:id', upload, async (req, res) => {
    try {
        const id = req.params.id;
        let new_image = '';

        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync('./uploads/' + req.body.old_image);
            } catch (err) {
                console.error(err);
            }
        } else {
            new_image = req.body.old_image;
        }

        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        }, { new: true });

        if (!updatedUser) {
            return res.json({ message: 'User not found', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, type: 'danger' });
    }
});




// Delete user route
// router.get('/delete/:id', (req, res) => {
//     let id = req.params.id;
//     User.findByIdAndRemove(id, (err, result) => {
//         if(result.image != ''){
//             try{
//                 fs.unlinkSync('./uploads/'+result.image);
//             } catch(err){
//                 console.log(err);
//             }
//         }
//         if (err){
//             res.json({message: err.message});
//         } else {
//             req.session.message ={
//                 type: 'info',
//                 message: 'User deleted successfully'
//             };
//             res.redirect('/');
//         }
//     })
// })



// Delete user route
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOneAndDelete({ _id: id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.image) {
            try {
                fs.unlinkSync('./uploads/' + user.image);
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error deleting image' });
            }
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully'
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});



module.exports = router;