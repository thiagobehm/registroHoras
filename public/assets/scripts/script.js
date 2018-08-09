$(document).on('click', '.submit', function() {

    // var data = $('#myForm ').serialize();
    
    // $.ajax('https://jira.e-core.com/login.jsp', {
    //   type: 'POST',
    //   accept: "*/*",
    //   data: data,
    //   success: function(data) {
    //     alert('sucesso');
    //   },
    //   error: function() {
    //     console.log('error');
    //   }
    // });

    $.ajax('https://jira.e-core.com/rest/ponto/1/batida/byCurrentUser?startDate=06/08/2018&endDate=12/08/2018', {
      type: 'GET',
      contentType: "application/json;charset=UTF-8",
      success: function(data) {
        alert('sucesso');
        console.log(data);
      },
      error: function() {
        console.log('error');
      }
    });
    
  });


