import { auth, db, provider } from './firebaseConfig.js';
import { signInWithEmailAndPassword, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref, set, get, update, remove, child } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

function showScreen(screenId) {
    const screens = ['loginScreen', 'createEnigmaScreen', 'createTeamScreen', 'solveEnigmaScreen'];
    screens.forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

window.loginWithEmail = function() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Usuário autenticado com sucesso: ", user);
            handleUser(user, 'createEnigmaScreen');
        })
        .catch((error) => {
            document.getElementById('loginMessage').innerText = "Erro: " + error.message;
            console.error("Erro ao autenticar com e-mail: ", error);
        });
};

window.loginWithGoogle = function() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("Usuário autenticado com sucesso via Google: ", user);
            handleUser(user, 'createEnigmaScreen');
        })
        .catch((error) => {
            document.getElementById('loginMessage').innerText = "Erro: " + error.message;
            console.error("Erro ao autenticar com Google: ", error);
        });
};

window.loginWithHostCode = function() {
    const code = document.getElementById('hostCodeInput').value;
    const dbRef = ref(db, 'users');

    get(dbRef).then((snapshot) => {
        let validCode = false;
        snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();
            if (userData.hostCode === code) {
                validCode = true;
                localStorage.setItem('hostCode', code);
                showScreen('createTeamScreen');
            }
        });
        if (!validCode) {
            document.getElementById('loginMessage').innerText = "Código do host inválido.";
            console.error("Código do host inválido.");
        }
    }).catch((error) => {
        document.getElementById('loginMessage').innerText = "Erro ao verificar código do host: " + error.message;
        console.error("Erro ao verificar código do host: ", error);
    });
};

function handleUser(user, nextScreen) {
    const userId = user.uid;
    const userRef = ref(db, `users/${userId}`);

    get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const code = generateRandomCode();
            set(userRef, {
                email: user.email,
                enigmas: {},
                hostCode: code
            })
            .then(() => {
                alert("Seu código de acesso é: " + code);
                localStorage.setItem('hostCode', code);
                showScreen(nextScreen);
            })
            .catch((error) => {
                console.error("Erro ao criar entrada no banco de dados para o usuário: ", error);
            });
        } else {
            alert("Seu código de acesso é: " + snapshot.val().hostCode);
            localStorage.setItem('hostCode', snapshot.val().hostCode);
            showScreen(nextScreen);
        }
    }).catch((error) => {
        console.error("Erro ao acessar dados do usuário: ", error);
    });
}

function generateRandomCode() {
    return Math.random().toString(36).substr(2, 9);
}

window.addEnigma = function() {
    const code = document.getElementById('codeInput').value;
    const question = document.getElementById('questionInput').value;
    const answer = document.getElementById('answerInput').value;
    const userId = auth.currentUser.uid;

    console.log(`Adicionando enigma: { code: ${code}, question: ${question}, answer: ${answer}, userId: ${userId} }`);

    const enigmaRef = ref(db, `users/${userId}/enigmas/${code}`);
    set(enigmaRef, {
        question: question,
        answer: answer
    })
    .then(() => {
        document.getElementById('addEnigmaMessage').innerText = "Enigma adicionado com sucesso!";
    })
    .catch((error) => {
        document.getElementById('addEnigmaMessage').innerText = "Erro ao adicionar enigma: " + error.message;
        console.error("Erro ao adicionar enigma: ", error);
    });
};

window.addMember = function() {
    const memberInput = document.createElement('input');
    memberInput.type = 'text';
    memberInput.className = 'member-input';
    memberInput.placeholder = 'Nome do Integrante';
    document.getElementById('membersContainer').appendChild(memberInput);
};

window.createTeam = function() {
    const teamName = document.getElementById('teamNameInput').value;
    const members = Array.from(document.querySelectorAll('.member-input')).map(input => input.value);

    console.log(`Criando equipe: { teamName: ${teamName}, members: ${members} }`);

    const teamRef = ref(db, 'teams/' + teamName);
    set(teamRef, {
        members: members
    })
    .then(() => {
        document.getElementById('createTeamMessage').innerText = "Equipe criada com sucesso!";
        showScreen('solveEnigmaScreen');
    })
    .catch((error) => {
        document.getElementById('createTeamMessage').innerText = "Erro ao criar equipe: " + error.message;
        console.error("Erro ao criar equipe: ", error);
    });
};

   // Função para atualizar o contador de chaves
   function updateKeyCounter() {
    const teamName = localStorage.getItem('teamName');
    const hostCode = localStorage.getItem('hostCode');

    if (teamName && hostCode) {
        const dbRef = ref(db);
        get(child(dbRef, `users`))
            .then((snapshot) => {
                snapshot.forEach((userSnapshot) => {
                    const userData = userSnapshot.val();
                    if (userData.hostCode === hostCode) {
                        get(child(dbRef, `users/${userSnapshot.key}/teams/${teamName}`))
                            .then((teamSnapshot) => {
                                if (teamSnapshot.exists()) {
                                    const keys = teamSnapshot.val().keys || 0;
                                    document.getElementById('keyCounter').innerText = keys;
                                } else {
                                    document.getElementById('keyCounter').innerText = '0';
                                }
                            });
                    }
                });
            })
            .catch((error) => {
                console.error("Erro ao acessar os dados das equipes: ", error.message);
            });
    }
}


  window.solveEnigma = function() {
    const teamName = document.getElementById('teamNameInput').value;
    const code = document.getElementById('codeSolveInput').value;
    const hostCode = localStorage.getItem('hostCode'); // Recupera o código do host armazenado

    if (teamName && code) {
      if (hostCode) {
        // Armazenar o nome da equipe no localStorage
        localStorage.setItem('teamName', teamName);

        const dbRef = ref(db);
        get(child(dbRef, `users`))
          .then((snapshot) => {
            let enigmaFound = false;
            snapshot.forEach((userSnapshot) => {
              const userData = userSnapshot.val();
              if (userData.hostCode === hostCode) {
                get(child(dbRef, `users/${userSnapshot.key}/enigmas/${code}`))
                  .then((enigmaSnapshot) => {
                    if (enigmaSnapshot.exists()) {
                      const enigma = enigmaSnapshot.val();
                      document.getElementById('solveEnigmaMessage').innerText = enigma.question;
                      document.getElementById('solveEnigmaMessage').style.color = 'blue';
                      document.getElementById('answerSolveInput').style.display = 'block';
                      document.querySelector('button[onclick="submitAnswer()"]').style.display = 'block';
                      enigmaFound = true;
                    } else {
                      document.getElementById('solveEnigmaMessage').innerText = "Enigma não encontrado.";
                      document.getElementById('solveEnigmaMessage').style.color = 'red';
                      document.getElementById('answerSolveInput').style.display = 'none';
                      document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
                    }
                  })
                  .catch((error) => {
                    document.getElementById('solveEnigmaMessage').innerText = "Erro ao buscar enigma: " + error.message;
                    document.getElementById('solveEnigmaMessage').style.color = 'red';
                    document.getElementById('answerSolveInput').style.display = 'none';
                    document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
                  });
              }
            });
            if (!enigmaFound) {
              document.getElementById('solveEnigmaMessage').innerText = "Código do host inválido.";
              document.getElementById('solveEnigmaMessage').style.color = 'red';
              document.getElementById('answerSolveInput').style.display = 'none';
              document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
            }
          })
          .catch((error) => {
            document.getElementById('solveEnigmaMessage').innerText = "Erro ao acessar os dados dos usuários: " + error.message;
            document.getElementById('solveEnigmaMessage').style.color = 'red';
            document.getElementById('answerSolveInput').style.display = 'none';
            document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
          });
      } else {
        document.getElementById('solveEnigmaMessage').innerText = "Código do host não encontrado. Você deve fazer login novamente.";
        document.getElementById('solveEnigmaMessage').style.color = 'red';
      }
    } else {
      document.getElementById('solveEnigmaMessage').innerText = "Por favor, insira o nome da equipe e o código do enigma.";
      document.getElementById('solveEnigmaMessage').style.color = 'red';
    }
  };

  window.submitAnswer = function() {
    const teamName = localStorage.getItem('teamName');
    const code = document.getElementById('codeSolveInput')?.value?.trim();
    const answer = document.getElementById('answerSolveInput')?.value?.trim();
    const hostCode = localStorage.getItem('hostCode');

    if (teamName && code && answer) {
        if (hostCode) {
            const dbRef = ref(db);
            get(child(dbRef, `users`))
                .then((snapshot) => {
                    let enigmaFound = false;
                    snapshot.forEach((userSnapshot) => {
                        const userData = userSnapshot.val();
                        if (userData.hostCode === hostCode) {
                            get(child(dbRef, `users/${userSnapshot.key}/enigmas/${code}`))
                                .then((enigmaSnapshot) => {
                                    if (enigmaSnapshot.exists()) {
                                        const enigma = enigmaSnapshot.val();
                                        if (enigma.answer.trim() === answer) {
                                            document.getElementById('solveEnigmaMessage').innerText = "Resposta correta! Sua equipe ganhou uma chave.";
                                            document.getElementById('solveEnigmaMessage').style.color = 'green';

                                            const teamRef = ref(db, `users/${userSnapshot.key}/teams/${teamName}`);
                                            get(teamRef)
                                                .then((teamSnapshot) => {
                                                    let keys = teamSnapshot.exists() && teamSnapshot.val().keys ? teamSnapshot.val().keys : 0;
                                                    keys++;
                                                    if (keys >= 4) {
                                                        // Equipe ganha um tesouro, resetar as chaves
                                                        document.getElementById('solveEnigmaMessage').innerText = "Parabéns! Sua equipe encontrou um tesouro!";
                                                        document.getElementById('solveEnigmaMessage').style.color = 'gold';
                                                        update(teamRef, { keys: 0 })
                                                            .then(() => {
                                                                console.log("Chaves resetadas após ganhar o tesouro.");
                                                            })
                                                            .catch((error) => {
                                                                console.error("Erro ao resetar chaves: ", error);
                                                            });
                                                    } else {
                                                        // Atualiza o número de chaves da equipe
                                                        update(teamRef, { keys })
                                                            .then(() => {
                                                                console.log("Chaves atualizadas com sucesso.");
                                                            })
                                                            .catch((error) => {
                                                                console.error("Erro ao atualizar chaves: ", error);
                                                            });
                                                    }

                                                    updateKeyCounter(keys); // Atualiza o contador de chaves
                                                    // Remover o enigma do banco de dados
                                                    remove(ref(db, `users/${userSnapshot.key}/enigmas/${code}`))
                                                        .then(() => {
                                                            console.log("Enigma removido com sucesso.");
                                                        })
                                                        .catch((error) => {
                                                            console.error("Erro ao remover enigma: ", error);
                                                        });
                                                })
                                                .catch((error) => {
                                                    console.error("Erro ao acessar dados da equipe: ", error);
                                                });
                                        } else {
                                            document.getElementById('solveEnigmaMessage').innerText = "Resposta incorreta. Tente novamente.";
                                            document.getElementById('solveEnigmaMessage').style.color = 'red';
                                        }
                                    } else {
                                        document.getElementById('solveEnigmaMessage').innerText = "Enigma não encontrado.";
                                        document.getElementById('solveEnigmaMessage').style.color = 'red';
                                    }
                                })
                                .catch((error) => {
                                    console.error("Erro ao verificar a resposta: ", error);
                                });
                        }
                    });
                    if (!enigmaFound) {
                        document.getElementById('solveEnigmaMessage').innerText = "Código do host inválido.";
                        document.getElementById('solveEnigmaMessage').style.color = 'red';
                        document.getElementById('answerSolveInput').style.display = 'none';
                        document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
                    }
                })
                .catch((error) => {
                    document.getElementById('solveEnigmaMessage').innerText = "Erro ao acessar os dados dos usuários: " + error.message;
                    document.getElementById('solveEnigmaMessage').style.color = 'red';
                    document.getElementById('answerSolveInput').style.display = 'none';
                    document.querySelector('button[onclick="submitAnswer()"]').style.display = 'none';
                });
        } else {
            document.getElementById('solveEnigmaMessage').innerText = "Código do host não encontrado. Você deve fazer login novamente.";
            document.getElementById('solveEnigmaMessage').style.color = 'red';
        }
    } else {
        document.getElementById('solveEnigmaMessage').innerText = "Por favor, insira o nome da equipe, o código do enigma e a resposta.";
        document.getElementById('solveEnigmaMessage').style.color = 'red';
    }
};

function closeModal() {
    document.getElementById('treasureModal').classList.add('hidden');
}

// Função para abrir o modal (se necessário)
function openModal() {
    document.getElementById('treasureModal').classList.remove('hidden');
}

// Exemplo de como abrir o modal
// openModal();



  function showTreasureModal() {
    const modal = document.getElementById('treasureModal');
    const span = document.getElementsByClassName('close')[0];
    modal.style.display = 'block';

    span.onclick = function() {
      modal.style.display = 'none';
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    }
  }

  // Inicializa o contador de chaves ao carregar a página
  document.addEventListener('DOMContentLoaded', () => {
    updateKeyCounter();
  });
