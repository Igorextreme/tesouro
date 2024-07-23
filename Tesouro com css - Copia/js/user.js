
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCB4R_ixloHBJSvVJEr69fPqnzEhdZjvVw",
  authDomain: "tesouro-1777a.firebaseapp.com",
  databaseURL: "https://tesouro-1777a-default-rtdb.firebaseio.com",
  projectId: "tesouro-1777a",
  storageBucket: "tesouro-1777a.appspot.com",
  messagingSenderId: "454369768010",
  appId: "1:454369768010:web:80b30f52686f7a8a19acb3",
  measurementId: "G-B5NQSMHK33"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.createTeam = function() {
  const teamName = document.getElementById('teamNameInput').value;
  const memberInputs = document.querySelectorAll('.member-input');
  const members = Array.from(memberInputs)
    .map(input => input.value.trim())
    .filter(value => value);

  if (teamName && members.length > 0) {
    set(ref(db, 'teams/' + teamName), {
      members: members
    })
    .then(() => {
      document.getElementById('createTeamMessage').innerText = "Equipe criada com sucesso!";
      document.getElementById('createTeamMessage').style.color = 'green';
      // Mostrar a seção para resolver enigmas
      document.getElementById('solveEnigmaSection').style.display = 'block';
    })
    .catch((error) => {
      document.getElementById('createTeamMessage').innerText = "Erro ao criar equipe: " + error.message;
      document.getElementById('createTeamMessage').style.color = 'red';
    });
  } else {
    document.getElementById('createTeamMessage').innerText = "Por favor, preencha todos os campos e adicione pelo menos um integrante.";
    document.getElementById('createTeamMessage').style.color = 'red';
  }
};

window.addMember = function() {
  const newMemberContainer = document.createElement('div');
  newMemberContainer.className = 'member-container';
  newMemberContainer.innerHTML = `
    <input type="text" class="member-input" placeholder="Nome do Integrante">
    <button onclick="addMember()">+</button>
  `;
  document.getElementById('membersContainer').appendChild(newMemberContainer);
};
