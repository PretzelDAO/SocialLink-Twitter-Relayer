require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const router = require('./router');
const cors = require('cors');


const app = express();


app.use(bodyParser.json());
app.use(cors())
router(app);

const PORT = process.env.PORT || 12345;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

