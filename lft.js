Subjects = new Meteor.Collection('Subjects');

// Gestion des comptes utilisateurs
if (Meteor.users.find({username: 'rebolon'}).count() === 0) {
        Accounts.createUser({username: 'rebolon', 'email': 'richard.tribes@gmail.com', 'password': 'default', 'profile': {name: 'Benjamin', role: ['admin']}});
}

Accounts.config({sendVerificationEmail: true,
    forbidClientAccountCreation: true});

// common lib
isAdmin = function funcIsAdmin() {
  'use strict';
  var user = Meteor.user();
  if (!user) {
     console.log('Utilisateur non connecté');
     return;
  }
  var isAdmin = false;
  user.profile.role.forEach(function (item) {
    if(item === 'admin') {
      isAdmin = true;
    }
  });
  if (!isAdmin) {
    console.log('Suppression de sujet réservé aux admins.');
    return;
  }
  return isAdmin;
}

// Meteor part
if (Meteor.isClient) {
  Session.setDefault('error', '');

  Template.error.helpers({
    getError: function () {
      return Session.get('error');
    }
  });

  Template.list.subjects = function () {
	  var list = Subjects.find({status: 'pending'}, {sort:{point: -1, desc: -1}});
  	if (list.count() === 0) {
	  	return false;
	  }

	  return list;
  };

  Template.newSubject.events({
    'focus #fldNewSubject' : function () {
	    Session.set('error', '');
    },

    'click #btnNewSubject' : function () {
    	var newSubject =  document.querySelector('#fldNewSubject').value;
      var newDescription =  document.querySelector('#fldNewDescription').value;
      if (newSubject.length < 10) {
        Session.set('error', 'Un sujet doit avoir au moins 10 caractères');
        return;
      }

      Meteor.call('addSubject', newSubject, newDescription, function funcAddSubjectCallback(error, result) {
console.log(arguments);
        if (error) {
          console.log(error);
          Session.set('error', error.reason);
          return;
        }

        if (result) {
          document.querySelector('#fldNewSubject').value = '';
          document.querySelector('#fldNewDescription').value = '';
        }
      });
    }
  });

  // @TODO ne pas mettre le html ici
  Template.subject.btnDelSubject = function () {
    var user = Meteor.user();
    if (isAdmin()) {
	    return '<button id="btnDelSubject" title="Supprimez le sujet"><i class="icon-trash"></i></button>';
    }

    return false;
  };

  Template.subject.rendered = function () {
    $('#subject-' + this.data._id).popover();
  };
  
  Template.subject.events({
    'click #btnVoteUp' : function () {
      /*if () {
        Session.set('error', 'Vous n'avez plus de point disponible.');
      }*/
    
      Meteor.call('voteUp', this._id);
    },

    'click #btnVoteDown' : function () {
      /*if () {
        Session.set('error', 'Vous n'avez plus de point disponible.');
      }*/
    
      Meteor.call('voteDown', this._id);
    },

    'click #btnDelSubject' : function () {
	    Meteor.call('rmSubject', this._id);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      rmSubject: function funcRmSubject(id) {
        "use strict";
        var user = Meteor.user(),
            subject = Subjects.findOne({_id: id}),
      errMsg;
  
        if (!isAdmin()) {
      errMsg = 'Suppression de sujet réservé aux admins.';
        }
        if (!subject) {
      errMsg = 'Sujet non trouvé, suppression impossible';
        }
        if (errMsg) {
                  console.log('error', errMsg);
                  return new Meteor.Error(500, errMsg);
              }
  
        Subjects.remove(id);
      },
  
      addSubject: function funcAddSubject(subject, desc) {
        var subject = subject.trim(),
            description = desc.trim(),
            errMsg;
  
        if (subject.length <10) {
          errMsg = 'Un sujet doit avoir au moins 10 caractères';
        }
        
        if (Subjects.find({desc: subject}).count() > 0) {
          var errMsg = 'Sujet déjà disponible';
        }
  
        if (errMsg) {
          console.log('error', errMsg);
           return new Meteor.Error(500, errMsg);
        }
  
        var id = Subjects.insert({subject: subject, desc: description, point: 0, status: 'pending', ownerId: Meteor.userId()});
        console.log('id: ', id);
        return id;
      },
  
      voteUp: function funcVoteUp(id) {
        // check user rights
        var subject = Subjects.find({_id: id}),
            errMsg;
  
        if (subject.count() !== 1) {
          errMsg = 'Sujet non trouvé: ' + id;
          console.log(errMsg);
          return new Meteor.Error(500, errMsg);
        }
  
        Subjects.update({_id: id}, {$inc: {point: 1}});
      },
  
      voteDown: function funcVoteDown(id) {
        // check user rights
        var subject = Subjects.find({_id: id}),
            errMsg;	
    
        if (subject.count() !== 1) {
          errMsg = 'Sujet non trouv�: ' + id;
          console.log(errMsg);
          return new Meteor.Error(500, errMsg);
        }
    
        Subjects.update({_id: id}, {$inc: {point: -1}});
      }
    });
  });
}
