var mongoClient = require('mongodb').MongoClient;
var url = 'mongodb://awakended:Ru486Rock@ds259255.mlab.com:59255/armchayanin'

mongoClient.connect(url, (err, db)=>{

    var express = require('express')
    var bodyParser = require('body-parser')
    var path = require('path')
    var app = express()
    var jwt = require('jsonwebtoken')
    var secret = 'dontknowwhyIneedthis'
    /* Body Parser Middleware */
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    /* Path for static content: Angular, Vue.js, html, js, css */
    // Create ‘index.html’ file inside the ‘public’ directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    
    app.get('/', (req, res)=>{
        db.collection('api405').find({}).toArray((err, result)=>{
            res.render('index',{result:result})
        })
    })
    
    app.get('/user', (req, res) =>{
        var users = db.collection('api405').find({}).toArray((err, result)=>{
            for(let i in result) delete result[i]._id
            res.json(result)
        })     
    })

    app.post('/user', (req, res)=>{
        db.collection('api405').find({}).toArray((err, result)=>{
            let idList = []           
            for(let obj of result){
                idList.push(obj.id)
            }
            let max = 0
            for(let x of idList){
                if(x>max) max = x;
            }
            req.body.id = max+1
            db.collection('api405').insertOne(req.body,(err, res)=>{})
            res.send({status:'success'})
        })         
    })

    app.post('/admin', (req, res)=>{
        db.collection('api405admin').insertOne(req.body, (err, result)=>{
            if(!err){
                res.send({status:'succeed'})
            }else{
                res.send({status:'failed'})
            }
        })
    })
    
    app.post('/login', (req, res)=>{
        db.collection('api405admin').find({username: req.body.username}).toArray((err,result)=>{
            if(err) res.send({status:'failed'})
            else{
                for(let user of result){
                    if(user.username == req.body.username && user.password == req.body.password){
                        let token = jwt.sign({admin:true}, secret,{ expiresIn:60})
                        res.send({status:'success', token:token, msg: "warning expire in 1 minute!!!"})   
                        return                 
                    }
                }
                res.send({status:'failed' ,msg:'wrong username or password'})
            }
        })
    })

    app.get('/user/:tagId', (req, res) =>{
        db.collection('api405').find({id : parseInt(req.params.tagId)}).toArray((err, result)=>{
            if(result.length==0){
                res.json({status:'failed',msg:'id not found'})
            }else
            delete result[0]._id
            res.json({status:'succeed',result:result})
        })     
    })

    app.put('/user/:tagId', (req, res)=>{
        let intId = parseInt(req.params.tagId)
        db.collection('api405').updateMany(
            {id : intId},
            {
                $set:{
                    name:req.body.name,
                    age: req.body.age,
                    email: req.body.email
                }
            }
        ).then(()=>res.send({status:'succeed'}))
    })

    app.delete('/user/:tagId', (req, res) =>{
        let token = req.body.token || req.query.token || req.headers['x-access-token'];
        if(token){
            jwt.verify(token, secret, (err,decoded)=>{
                if(err){
                    res.send({status:'failed', msg:'wrong token'})
                }else{
                    db.collection('api405').removeOne({id : parseInt(req.params.tagId)},(err, result)=>{
                        if(err || result.deletedCount==0){
                            res.json({status:"failed", msg:'id not found'})
                        }else{
                            res.json({status:"success"})
                        }
                    })
                }
            })
            
        }else{
            res.send({status:'failed',msg:'no token in header'})
        }
        
    })


    
    app.listen(3000,()=>{
        console.log('server started')
    })
    
})
