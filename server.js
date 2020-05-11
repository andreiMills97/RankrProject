console.log('Server running :)');

const express = require('express'); //makes server use the express framework
const MongoClient = require('mongodb').MongoClient; //server use mongodb
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))


// serve files from the public directory
app.use(express.static('public')); //public folder is for client side


// connect to the db and start the express server
let db; //let pretty much "protects" this variable from being reassigned
const url = 'mongodb://localhost:27017';

MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
    if (err) {
        return console.log(err);
    }
    db = client.db("rankr"); //now connected to database

    // create a collection named "entries":
    db.createCollection("entries", function (err, res) {//where are the list items are stored
        if (err) throw err;
        console.log("Collection 'entries' created!");
    });

    // start the express web server listening on 8080
    app.listen(8080, () => { //server expects info to come in through port 8080
        console.log('Listening on 8080');
    });
});


// serve the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); //home page and actually the only page
});


// add a document to the DB collection recording the entry
app.post('/entries', (req, res) => { // POST data received from form submit button
    let submit_action_value = req.body.submit_action;

    // get rank field entry from POST data
    let rank_value = parseInt(req.body.rank);

    if (rank_value < 1) {//make sure the rank vaule is actually the min rank
        rank_value = 1;
    }

    let item_value = req.body.item;// retreive what the the user typed in

    // if an entry is to be submitted
    if ((submit_action_value === "submit_button") || (submit_action_value === "drag_and_drop")) { //the r and u of crud

        // queries all items in the db collection entries
        db.collection('entries').find().toArray((err, result) => { //toArray here is how to actualy be able to run fuctions on whats found
            if (err) return console.log(err);

            let max_rank = result.length + 1; // get maximum rank value
            if (rank_value > max_rank) {// validate maximum rank value
                rank_value = max_rank; //how to get the drag and drop to adjust for highest val (eg 123-> user: 8 -> 1234 not 1238)
            }

            // query for documents with item_value
            const query = {item: item_value};
            db.collection('entries').findOne(query).then(result => {
                let previous_rank;
                // check if the user data was entered twice. on duplicate, rank is changed to new rank
                if (result) {
                    previous_rank = parseInt(result.rank);
                } else {
                    previous_rank = Number.POSITIVE_INFINITY; //null would mess up the ordering so this is esssentially just say "all the way at the bottom"
                }

                // update other documents with a rank >= rank_value and rank < previous_rank: rank +1
                const query = {$and: [{rank: {$gte: rank_value}}, {rank: {$lt: previous_rank}}]};
                //^im telling the db hey I want only want to update items greater than or equal to this new rank but less than previous
                const update = {$inc: {rank: 1}}; //push it down
                db.collection('entries').updateMany(query, update) //defined query and update above because so they can be params in update many
                    .catch(err => console.error(`Failed to update items: ${err}`))
                    .then(result => {
                        // update other documents with a rank <= rank_value and rank > previous_rank: rank -1
                        const query = {$and: [{$and: [{rank: {$lte: rank_value}}, {rank: {$gt: previous_rank}}]}]};
                        const update = {$inc: {rank: -1}}; //push it up
                        db.collection('entries').updateMany(query, update)
                            .catch(err => console.error(`Failed to update items: ${err}`))
                            // insert document with provided rank and item
                            .then(result => {
                                const query = {item: item_value};
                                const update = {
                                    "$set": {
                                        rank: rank_value,
                                        item: item_value
                                    }
                                };
                                const options = {upsert: true}; //all that mess above is for moving things around already on the list. this is the use ca
                                db.collection('entries').findOneAndUpdate(query, update, options)
                                    .catch(err => console.error(`Failed to insert item: ${err}`));
                                res.redirect('back');
                            });
                    });
            });
        });
    }

    // if an entry is to be deleted
    if (submit_action_value === "delete_button") {
        const query = {rank: rank_value, item: item_value};
        db.collection('entries').findOneAndDelete(query)
            .catch(err => console.error(`Failed to delete item: ${err}`))
            .then(result => {
                const query = {rank: {$gte: rank_value}};
                const update = {$inc: {rank: -1}};
                db.collection('entries').updateMany(query, update)
                    .then(result => {
                        res.redirect('back');
                    })
                    .catch(err => console.error(`Failed to update items: ${err}`));
            });
    }
});


// get the entry data from the database
// sorted ascending by rank
app.get('/entries', (req, res) => {

    db.collection('entries').find().sort({rank: 1}).toArray((err, result) => {
        if (err) return console.log(err);
        res.send(result);
    });
});
