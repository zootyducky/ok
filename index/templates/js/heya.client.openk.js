/*
 * @(#)/heya.client.openk.js  0.9, 2015-09-02
 * 
 * Heya의 openkakao bbs (Front end) 환경을 위한 JavaScript
 *
 * @author  Hyuk Jun Kim
 * @version 1.0, 2015-09-02
 */
var heya = heya || {};
var fbase = new Firebase("https://openkakao.firebaseio.com/");
var fver = "v1_0";

$(function() {
    // For Cross Origin Issue
    // using jQuery
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
});

$(document).ready(function () {
    var domSelf = this;
    var queryString = heya.util.queryString();

    domSelf.page = (queryString && queryString.page && queryString.page < 11) ? parseInt(queryString.page) : 1;
    var $loading = heya.data.loading();

    /* $("#facebook_auth_btn").on('click', function(ev) {
        if (!fbase.getAuth()) {
            fbase.authWithOAuthPopup("facebook", function (err, auth) {
                if (err) {
                    heya.util.notification("Login Failed" + err, function() {
                        location.reload();
                    });
                } else {
                    domself.uid = auth.uid;

                    $("#facebook_auth_btn").removeClass("btn-danger");
                    $("#facebook_auth_btn").addClass("btn-primary");
                    $("#refresh_btn").trigger("click");
                }
            }, {
                remember: "sessionOnly"
                , scope: "email,user_likes"
            });
        }
    }); */

    $(".pagination ul").empty();

    fbase.child(fver + "/threads/").limitToLast(750).once("value", function(threadSnap) {
        if ($loading) $loading.modal('hide');
        if (threadSnap.val()) {
            domSelf.threads = threadSnap.val();
            domSelf.threadKeys = Object.keys(domSelf.threads);
            var threadCount = domSelf.threadKeys.length;
            var pageCount = Math.ceil(threadCount / 15);

            for (var i = 1; i <= pageCount; i++) {
                var $liPage = '<li><a href="#" data-page="' + i.toString() + '">' + i.toString() + '</a></li>'
                $(".pagination ul").append($liPage);
            }

            if (pageCount > 749) {
                $(".pagination ul").prepend('<li><a href="#" data-page="prev">Prev</a></li>');
                $(".pagination ul").append('<li><a href="#" data-page="next">Next</a></li>');
            }

            $('.pagination ul li a').on('click', function(ev) {
                ev.preventDefault();
                $(".openk-contents").empty();

                if ($(this).data('page') != 'next' || $(this).data('page') != 'prev') {
                    domSelf.page = $(this).data('page');
                    var threadCnt = domSelf.threadKeys.length;
                    var startIdx = (domSelf.page - 1) * 15;
                    var endIdx = (domSelf.page * 15 > threadCnt) ? threadCnt : domSelf.page * 15 - 1;
                    var pageKeys = domSelf.threadKeys.slice(startIdx, endIdx);

                    $.each(pageKeys, function(idx, threadKey) {
                        var $thread = domSelf.threads[threadKey];

                        if (idx % 3 == 0) $('.openk-contents').append('<div class="row post_row"></div>');

                        var $post = $('<div class="span4 post"></div>');
                        if (idx % 3 == 2 || idx == pageKeys.length) $post.addClass("last");

                        var inDate = new Date($thread.inDate);
                        var $postContent = $('<div class="text">' +
                            '<h5><a data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#">' + $thread.subject + '</a></h5>' +
                            '<span class="date">' + heya.util.date.formatDateTime(inDate) + '</span>' +
                            '<p>' + $thread.description + '</p></div>' +
                            '<div class="author_box"><h6><a data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#">' + $thread.URL + '</a></h6>' +
                            '<p>' + $thread.totalCount + ' Clicks</p></div>' +
                            '<a class="plus_wrapper" data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#"><span>&#43;</span></a>');
                        $post.append($postContent);

                        $('.openk-contents .post_row:last-child').append($post);
                    });

                    $('.openk-contents .post_row a').on("click", function(ev) {
                        ev.preventDefault();
                        var $target = fbase.child(fver + "/threads/" + $(this).data("key"));
                        $target.child("dailyCount").transaction(function(currentSnap) {
                            return currentSnap + 1;
                        });
                        $target.child("weeklyCount").transaction(function(currentSnap) {
                            return currentSnap + 1;
                        });
                        $target.child("totalCount").transaction(function(currentSnap) {
                            return currentSnap + 1;
                        }, function(err, committed, cntSnap) {
                            location.href = $(this).data('url');
                        });
                    });
                }
            });

            $('.pagination ul li a[data-page="' + domSelf.page + '"]').trigger('click');
        }
    });

    $('input#add_subject').keypress(function(ev) {
        if (ev.which == 13) $('input#add_url').focus();
    });

    $('input#add_url').keypress(function(ev) {
        if (ev.which == 13) $('input#add_description').focus();
    });

    $('input#add_url').focusout(function() {
        if ($(this).val().indexOf('http://open.kakao.com') < 0) {
            $("#error_message").text('올바른 OPEN KAKAO URL을 입력해 주세요');
        }
    });

    $('input#add_description').keypress(function(ev) {
        if (ev.which == 13) $(this).parent().parent().children('button').trigger("click");
    });

    $('.submit-box .form button').on("click", function() {
        var subject = $('input#add_subject').val();
        var url = $('input#add_url').val();
        var description = $('input#add_description').val();

        if (subject == "" || subject == null) {
            $('#error_message').text('제목을 입력해 주세요');
        } else if (url == "" || url == null || url.indexOf('http://open.kakao.com') < 0) {
            $('#error_message').text('올바른 OPEN KAKAO URL을 입력해 주세요');
        } else {
            $('#error_message').text('');

            fbase.child(fver + "/threadCount/").once("value", function(countSnap) {
                var threadCount = countSnap.val();
                var $target = fbase.child(fver + "/threads/");
                var $thread = {
                    "index": (countSnap.val() + 1)
                    , "subject": subject
                    , "URL": url
                    , "description": description
                    , "inDate": Firebase.ServerValue.TIMESTAMP
                    , "dailyCount": 0
                    , "weeklyCount": 0
                    , "totalCount": 0
                };

                $target.setPriority(Firebase.ServerValue.TIMESTAMP);
                $target.push($thread);
                fbase.child(fver + "/threadCount/").transaction(function(currentCount) {
                    return currentCount + 1;
                });

                $('input#add_subject').val('');
                $('input#add_url').val('');
                $('input#add_description').val('');
                heya.util.notification("추가되었습니다");
            });
        }

        $(this).parent().children('input[type="text"]').val("");
    });
});