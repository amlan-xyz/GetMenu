const BaseJoi=require('joi');
const sanitizeHtml=require('sanitize-html')
const extension =(joi)=>({
    type:'string',
    base:joi.string(),
    messages:{
        'string.escapeHTML':'Oh! you cannot use this here'
    },
    rules:{
        escapeHTML:{
            validate(value,helpers){
                const clean = sanitizeHtml(value,{
                    allowedTags:[],
                    allowedAttributes:{},
                });
                if(clean!== value) return helpers.error('string.escapeHTML',{value})
                return clean;
            }
        }
    }
});

const Joi=BaseJoi.extend(extension);

module.exports.userSchema=Joi.object({
    user:Joi.object({
        title:Joi.string().required().escapeHTML(),
        location:Joi.string().required().escapeHTML(),
        speciality:Joi.string().required().escapeHTML(),
        phone:Joi.number().required().min(0)
    }).required()
});


module.exports.sectionSchema=Joi.object({
    section:Joi.object({
        title:Joi.string().required().escapeHTML(),
    }).required()
});

module.exports.itemSchema=Joi.object({
    item:Joi.object({
        title:Joi.string().required().escapeHTML(),
        price:Joi.number().required().min(0)
    }).required()
});