var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io').listen(server);
var mysql = require('mysql');


//create the connection 
var connect = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ensak_abs_db'
});
//connect to the base 
connect.connect(function(eror){
    if (!!eror) {
        console.log('Error');
    }else{
        console.log("Connected");
    }
});


server.listen(3000,function(){
	console.log("Server connect port : 3000");
}); 



io.on('connection', function (socket) {

  socket.on('login',function(data){
    console.log(data);
  		connect.query("SELECT * FROM utilisateur WHERE email = ? AND password = ? LIMIT 1",[data.userName,data.userPass],function(error, rows){
        if (error) {
          console.log("Error in the query");
        }else {
            socket.emit('login', {
                  "rows": rows[0]
                }); 
          //
        }
      });      
  });
  //

  socket.on('absence_etudiant',function(data){
    //console.log(data);
    var rows_abs_etudiant = null, liste_prof_abs = null;
      connect.query("SELECT absence_etudiant.id_absence_etudiant, absence_etudiant.id_etudiant, seance.libelle_cours, utilisateur.nom , utilisateur.prenom, absence_etudiant.date_seance , absence_etudiant.etat "+
        "FROM absence_etudiant "+
        "INNER JOIN utilisateur ON absence_etudiant.id_professeur = utilisateur.id_utilisateur"+
        " INNER JOIN seance ON absence_etudiant.id_seance = seance.id_seance WHERE absence_etudiant.id_etudiant = " + data ,
        function(error, rows){
        if (error) {
          console.log("Error in the query");
        }else {
          //rows_abs_etudiant = rows;
          //console.log(rows);
          socket.emit('absence_etudiant', {
                  "rows_abs_et": rows
                }); 
        }
      }); 
      //console.log(rows_abs_etudiant);
      connect.query("SELECT U.id_annee, U.id_cycle, U.id_filiere FROM utilisateur U where u.id_utilisateur = ? LIMIT 1 ",
        data , function(error, rows){
        if (error) {
          console.log("Error in the query");
        }else {
          if (rows.length > 0) {
           //console.log("id_annee : "+rows[0].id_annee); 
           etud_info = rows[0];
           //console.log(etud_info.id_cycle +"=> fil: "+ etud_info.id_filiere +"=> ann :"+ etud_info.id_annee);
           connect.query("SELECT SE.id_seance FROM seance_etudiant SE WHERE SE.id_cycle = ? AND SE.id_filiere = ? AND SE.id_annee = ?",
                                                            [etud_info.id_cycle, etud_info.id_filiere, etud_info.id_annee] , function(error, rslt){
              if (error) {
                console.log("Error in the query");
              }else {
                
                //foreach au resulatats 
                rslt.forEach(function(item){
                  //liste des absence des profs
                  connect.query("SELECT AP.id_absence_professeur , S.libelle_cours, U.nom, U.prenom, AP.date_absence_professeur "+
                      "FROM absence_professeur AP "+
                      "INNER JOIN utilisateur U ON AP.id_professeur = U.id_utilisateur "+
                      " INNER JOIN seance S ON AP.id_seance = S.id_seance WHERE S.id_seance = ?", item.id_seance ,
                       function(error, rows){
                    if (error) {
                      console.log("Error in the query");
                    }else {
                      //console.log(rows);
                      //liste_prof_abs = rows;
                      //console.log(rows);
                      socket.emit('absence_prof', {
                        "rows_abs_prof": rows
                      }); 
                    }
                  });
                  //console.log(liste_prof_abs);
                  //liste des seance des rattrapage des profs absents 
                  /*
                  liste_prof_abs.foreach(function(item){

                     connect.query("SELECT  SR.date_seance_rattrapage FROM seance_rattrapage SR WHERE SR.etat = 1 AND SR.id_absence_professeur = ?", 
                      item.id_absence_professeur , function(error, rows){
                        if (error) {
                          console.log("Error in the query");
                        }else {
                          console.log(rows);
                        }
                      }); 

                  });
                  */
                  
                });
              }
            });
          }
          
        }
      });     
  });

  //
});
