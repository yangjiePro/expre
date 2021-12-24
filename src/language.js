/**
 * language
 */
const fs = require('fs')
const path = require('path')
const utilfs = require('./util/fs')

const languageDataCache = {}

function loadLanguage(langdir, type) {
    if( languageDataCache[type] ) {
        return languageDataCache[type] 
    }
    var langs = {}
    loadLanguageItem(langs, langdir + '/' + type)
    // console.log(langs)
    languageDataCache[type] = langs
    return langs
}

function loadLanguageItem(langs, dir) {
    const flist = utilfs.scanSync(dir)
    for(let i in flist.files){
        let one = flist.files[i]
        , key = path.basename(one).replace('.js', '')
        , lobj = require(one)
        // console.log('files', i, key, one, lobj)
        langs[key] = lobj
        return
    }
    return flist.folders
}


/**
 * load language
 */
exports.load = async function(paths, cnf, app) {
    var langdir = paths.language
    if( ! fs.statSync(langdir, {throwIfNoEntry: false})) {
        console.log(`[Note] cannot find language dir '${langdir}'.`)
        return
    }
    // start
    var types =  utilfs.scanSync(langdir).folders
    , realuselang = null
    , firstlang = null
    , langdirs = {}
    // load
    for(var i in types) {
        var ty = path.basename(types[i])
        if(firstlang == null){
            firstlang = ty
        }
        if(cnf.lang == ty) {
            realuselang = ty
        }
        langdirs[ty] = types[i]
    }
    // use 
    realuselang = realuselang || firstlang
    // select
    app.use(async (ctx, next) => {
        var q = ctx.request.query
        , cklang = ctx.cookies.get("lang")
        if( q.lang ) {
            if(langdirs[q.lang]) {
                ctx.cookies.set("lang", q.lang, {path:"/", maxAge:1000*60*60*24*365, httpOnly: true})
                realuselang = q.lang // change use
            }else{
                if(cnf.debug){
                    console.log(`cannot find language <${q.lang}> from url query lang`)
                }   
            }
        }else if(cklang) {
            realuselang = cklang // read use from cookie
        }
        // require lang
        var langdata = loadLanguage(langdir, realuselang)
        // data
        ctx.lang = {
            use: realuselang,
            data: langdata,
        } 
        // console.log(ctx.lang)
        // ok next
        await next();
      });
}