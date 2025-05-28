const express = require('express');
const router = express.Router();
const {
    getAllFreelancers,
    getFreelancersBySkill,
    getFreelancersBySkillAndLevel,
    getFreelancersByCountry
} = require('../controllers/freelancer.controller');

// Obtener todos los freelancers
router.get('/', getAllFreelancers);

// Filtrar freelancers por skill
router.get('/skill/:skillName', getFreelancersBySkill);

// Filtrar freelancers por skill y nivel
router.get('/skill/:skillName/level/:minLevel', getFreelancersBySkillAndLevel);

// Filtrar freelancers por país
router.get('/country/:country', getFreelancersByCountry);

module.exports = router; 