const ReviewsList = ({ reviews }) => {
    return (
        <div className="movie-reviews-list">
            <h3>Reviews:</h3>
            <ul>
                {reviews.map((review, index) => (
                    <li key={index}> Title: {review.title} <br/><br/> Rating:{review.rating} <br/><br/> Review: {review.review}</li>
                ))}
            </ul>
        </div>
    );
};

export default ReviewsList;
